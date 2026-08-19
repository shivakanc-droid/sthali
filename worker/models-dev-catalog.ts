export type ModelsDevOffer = {
  provider_id: string;
  provider_name: string;
  provider_doc: string | null;
  provider_page: string;
  model_id: string;
  context: number | null;
  output: number | null;
  cost_input: number | null;
  cost_output: number | null;
  reasoning: boolean | null;
  tool_call: boolean | null;
  structured_output: boolean | null;
  temperature: boolean | null;
};

export type ModelsDevRow = {
  id: string;
  name: string;
  lab: string;
  family: string | null;
  description: string | null;
  providers: number;
  context: number | null;
  output: number | null;
  reasoning: boolean;
  tool_call: boolean;
  structured_output: boolean | null;
  temperature: boolean | null;
  open_weights: boolean;
  knowledge: string | null;
  release_date: string | null;
  last_updated: string | null;
  modalities: {
    input: string[];
    output: string[];
  };
  price: {
    input: number | null;
    output: number | null;
  } | null;
  source_url: string;
};

export type ModelsDevIndex = {
  source: "models.dev";
  attribution_url: string;
  license: "MIT";
  fetched_at: string;
  model_count: number;
  models: ModelsDevRow[];
  offers_by_model: Record<string, ModelsDevOffer[]>;
};

export type ModelsDevQuery = {
  q?: string;
  lab?: string;
  reasoning?: boolean;
  tool_call?: boolean;
  open_weights?: boolean;
  structured_output?: boolean;
  /** Input/output modality filter: image (vision), audio, video, pdf, text */
  modality?: string;
  embedding?: boolean;
  reranking?: boolean;
  page?: number;
  page_size?: number;
};

type R2Like = {
  get(key: string): Promise<{ text(): Promise<string>; customMetadata?: Record<string, string> } | null>;
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
};

const CACHE_KEY = "catalogs/models-dev/index-v2.json";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const MODELS_JSON_URL = "https://models.dev/models.json";
const API_JSON_URL = "https://models.dev/api.json";
const ATTRIBUTION_URL = "https://models.dev";

let memoryIndex: ModelsDevIndex | null = null;
let memoryLoadedAt = 0;
let refreshInFlight: Promise<ModelsDevIndex> | null = null;

export async function listModelsDev(
  artifacts: R2Like,
  query: ModelsDevQuery = {}
) {
  const index = await getModelsDevIndex(artifacts);
  const filtered = filterModels(index.models, query);
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.page_size ?? 25));
  const offset = (page - 1) * pageSize;
  const models = filtered.slice(offset, offset + pageSize);

  return {
    source: index.source,
    attribution_url: index.attribution_url,
    license: index.license,
    fetched_at: index.fetched_at,
    total: filtered.length,
    page,
    page_size: pageSize,
    has_more: offset + models.length < filtered.length,
    models
  };
}

export async function getModelsDevModel(artifacts: R2Like, modelId: string) {
  const index = await getModelsDevIndex(artifacts);
  const normalized = normalizeModelId(modelId);
  const model = index.models.find((row) => normalizeModelId(row.id) === normalized)
    ?? index.models.find((row) => row.id === modelId);
  if (!model) return null;

  return {
    source: index.source,
    attribution_url: index.attribution_url,
    license: index.license,
    fetched_at: index.fetched_at,
    model,
    providers: index.offers_by_model[model.id] ?? []
  };
}

export async function searchModelsDevForAgent(
  artifacts: R2Like,
  payload: Record<string, unknown>
) {
  const q = optionalString(payload, ["q", "query", "search", "model"]);
  const modelId = optionalString(payload, ["model_id", "id"]);
  const intentHint = optionalString(payload, ["intent"]) ?? "";

  if (modelId || /get_model|lookup_model|list_model_providers/i.test(intentHint)) {
    const id = modelId ?? q;
    if (!id) throw new Error("model_id is required");
    const detail = await getModelsDevModel(artifacts, id);
    if (!detail) throw new Error(`Model not found: ${id}`);
    return {
      ok: true,
      intent: "get_model",
      model: detail.model,
      providers: detail.providers.slice(0, 40),
      provider_count: detail.providers.length,
      attribution_url: detail.attribution_url,
      source: "models.dev",
      fetched_at: detail.fetched_at,
      generated_at: new Date().toISOString(),
      notice: "Informational model directory data (MIT-licensed source). Confirm provider pricing and limits before production use."
    };
  }

  const result = await listModelsDev(artifacts, {
    q: q ?? undefined,
    lab: optionalString(payload, ["lab", "author"]) ?? undefined,
    reasoning: optionalBoolean(payload, ["reasoning"]),
    tool_call: optionalBoolean(payload, ["tool_call", "tools"]),
    open_weights: optionalBoolean(payload, ["open_weights", "open_weights_only"]),
    structured_output: optionalBoolean(payload, ["structured_output"]),
    modality: optionalString(payload, ["modality", "modalities"]) ?? undefined,
    embedding: optionalBoolean(payload, ["embedding", "embeddings"]),
    reranking: optionalBoolean(payload, ["reranking", "rerank"]),
    page: optionalNumber(payload, ["page"]) ?? 1,
    page_size: Math.min(25, optionalNumber(payload, ["limit", "page_size"]) ?? 10)
  });

  return {
    ok: true,
    intent: "search_models",
    total: result.total,
    page: result.page,
    page_size: result.page_size,
    has_more: result.has_more,
    models: result.models,
    attribution_url: result.attribution_url,
    source: "models.dev",
    fetched_at: result.fetched_at,
    generated_at: new Date().toISOString(),
    notice: "Informational model directory data (MIT-licensed source). Confirm provider pricing and limits before production use."
  };
}

async function getModelsDevIndex(artifacts: R2Like): Promise<ModelsDevIndex> {
  const now = Date.now();
  if (memoryIndex && now - memoryLoadedAt < CACHE_TTL_MS) {
    return memoryIndex;
  }

  const cached = await readCachedIndex(artifacts);
  if (cached && now - Date.parse(cached.fetched_at) < CACHE_TTL_MS) {
    memoryIndex = cached;
    memoryLoadedAt = now;
    return cached;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshModelsDevIndex(artifacts)
      .catch(async (error) => {
        if (cached) return cached;
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  const fresh = await refreshInFlight;
  memoryIndex = fresh;
  memoryLoadedAt = Date.now();
  return fresh;
}

async function readCachedIndex(artifacts: R2Like): Promise<ModelsDevIndex | null> {
  try {
    const object = await artifacts.get(CACHE_KEY);
    if (!object) return null;
    const parsed = JSON.parse(await object.text()) as ModelsDevIndex;
    if (!parsed?.models || !Array.isArray(parsed.models)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function refreshModelsDevIndex(artifacts: R2Like): Promise<ModelsDevIndex> {
  const [modelsJson, apiJson] = await Promise.all([
    fetchCachedJson(MODELS_JSON_URL),
    fetchCachedJson(API_JSON_URL)
  ]);

  const modelsMap = asRecord(modelsJson);
  const providersMap = asRecord(apiJson);
  const offersByModel: Record<string, ModelsDevOffer[]> = {};
  const canonicalIds = Object.keys(modelsMap);
  const canonicalByNormalized = new Map(canonicalIds.map((id) => [normalizeModelId(id), id]));

  for (const [providerId, providerValue] of Object.entries(providersMap)) {
    const provider = asRecord(providerValue);
    const providerName = typeof provider.name === "string" ? provider.name : providerId;
    const providerModels = asRecord(provider.models);
    for (const [providerModelId, modelValue] of Object.entries(providerModels)) {
      const model = asRecord(modelValue);
      const canonicalId = resolveCanonicalId(providerId, providerModelId, model, canonicalByNormalized);
      if (!canonicalId) continue;

      const offer: ModelsDevOffer = {
        provider_id: providerId,
        provider_name: providerName,
        provider_doc: typeof provider.doc === "string" && provider.doc.trim() ? provider.doc.trim() : null,
        provider_page: `${ATTRIBUTION_URL}/providers/${providerId}`,
        model_id: typeof model.id === "string" ? model.id : providerModelId,
        context: numberOrNull(asRecord(model.limit).context),
        output: numberOrNull(asRecord(model.limit).output),
        cost_input: numberOrNull(asRecord(model.cost).input),
        cost_output: numberOrNull(asRecord(model.cost).output),
        reasoning: booleanOrNull(model.reasoning),
        tool_call: booleanOrNull(model.tool_call),
        structured_output: booleanOrNull(model.structured_output),
        temperature: booleanOrNull(model.temperature)
      };

      const list = offersByModel[canonicalId] ?? (offersByModel[canonicalId] = []);
      list.push(offer);
    }
  }

  const models: ModelsDevRow[] = canonicalIds.map((id) => {
    const model = asRecord(modelsMap[id]);
    const offers = offersByModel[id] ?? [];
    const priced = offers.filter((offer) => offer.cost_input != null || offer.cost_output != null);
    const minInput = minNumber(priced.map((offer) => offer.cost_input));
    const minOutput = minNumber(priced.map((offer) => offer.cost_output));
    const lab = id.includes("/") ? id.slice(0, id.indexOf("/")) : "unknown";
    const modalities = asRecord(model.modalities);

    return {
      id,
      name: typeof model.name === "string" ? model.name : id,
      lab,
      family: typeof model.family === "string" ? model.family : null,
      description: typeof model.description === "string" ? model.description : null,
      providers: offers.length,
      context: numberOrNull(asRecord(model.limit).context),
      output: numberOrNull(asRecord(model.limit).output),
      reasoning: Boolean(model.reasoning),
      tool_call: Boolean(model.tool_call),
      structured_output: booleanOrNull(model.structured_output),
      temperature: booleanOrNull(model.temperature),
      open_weights: Boolean(model.open_weights),
      knowledge: typeof model.knowledge === "string" ? model.knowledge : null,
      release_date: typeof model.release_date === "string" ? model.release_date : null,
      last_updated: typeof model.last_updated === "string" ? model.last_updated : null,
      modalities: {
        input: stringArray(modalities.input),
        output: stringArray(modalities.output)
      },
      price: minInput != null || minOutput != null
        ? { input: minInput, output: minOutput }
        : null,
      source_url: `${ATTRIBUTION_URL}/models/${id}`
    };
  }).sort((a, b) => {
    const aDate = a.release_date ?? "";
    const bDate = b.release_date ?? "";
    return bDate.localeCompare(aDate) || a.name.localeCompare(b.name);
  });

  const index: ModelsDevIndex = {
    source: "models.dev",
    attribution_url: ATTRIBUTION_URL,
    license: "MIT",
    fetched_at: new Date().toISOString(),
    model_count: models.length,
    models,
    offers_by_model: offersByModel
  };

  await artifacts.put(CACHE_KEY, JSON.stringify(index), {
    httpMetadata: { contentType: "application/json" },
    customMetadata: {
      source: "models.dev",
      fetched_at: index.fetched_at,
      model_count: String(index.model_count)
    }
  });

  return index;
}

async function fetchCachedJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cf: {
      cacheTtl: 60 * 60 * 12,
      cacheEverything: true
    }
  } as RequestInit & { cf?: { cacheTtl?: number; cacheEverything?: boolean } });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`models.dev fetch failed (${response.status}) for ${url}`);
  }
  return JSON.parse(text) as unknown;
}

function filterModels(models: ModelsDevRow[], query: ModelsDevQuery) {
  const q = (query.q ?? "").trim().toLowerCase();
  const lab = (query.lab ?? "").trim().toLowerCase();
  const modality = (query.modality ?? "").trim().toLowerCase();

  return models.filter((model) => {
    if (lab && model.lab.toLowerCase() !== lab) return false;
    if (query.reasoning != null && model.reasoning !== query.reasoning) return false;
    if (query.tool_call != null && model.tool_call !== query.tool_call) return false;
    if (query.open_weights != null && model.open_weights !== query.open_weights) return false;
    if (query.structured_output != null && model.structured_output !== query.structured_output) return false;

    if (modality) {
      const mods = [...model.modalities.input, ...model.modalities.output].map((value) => value.toLowerCase());
      // "vision" is the UI alias for image modality in the source catalog
      const needle = modality === "vision" ? "image" : modality;
      if (!mods.includes(needle)) return false;
    }

    if (query.embedding) {
      const blob = `${model.id} ${model.name} ${model.family ?? ""}`.toLowerCase();
      if (!/embed/.test(blob)) return false;
    }

    if (query.reranking) {
      const blob = `${model.id} ${model.name} ${model.family ?? ""}`.toLowerCase();
      if (!/rerank/.test(blob)) return false;
    }

    if (!q) return true;

    const haystack = [
      model.id,
      model.name,
      model.lab,
      model.family ?? "",
      model.description ?? "",
      ...model.modalities.input,
      ...model.modalities.output
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function resolveCanonicalId(
  providerId: string,
  providerModelId: string,
  model: Record<string, unknown>,
  canonicalByNormalized: Map<string, string>
) {
  const candidates = [
    typeof model.base_model === "string" ? model.base_model : null,
    providerModelId.includes("/") ? providerModelId : null,
    `${providerId}/${providerModelId}`,
    typeof model.id === "string" && model.id.includes("/") ? model.id : null
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const exact = canonicalByNormalized.get(normalizeModelId(candidate));
    if (exact) return exact;
  }

  const shortId = providerModelId.includes("/")
    ? providerModelId.slice(providerModelId.lastIndexOf("/") + 1)
    : providerModelId;
  const normalizedShort = normalizeModelId(shortId);
  for (const [normalized, canonical] of canonicalByNormalized) {
    if (normalized.endsWith(`/${normalizedShort}`)) return canonical;
  }

  return null;
}

function normalizeModelId(id: string) {
  return id.trim().toLowerCase().replace(/:/g, "/").replace(/\./g, "-");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function minNumber(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => typeof value === "number");
  if (!numbers.length) return null;
  return Math.min(...numbers);
}

function optionalString(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function optionalBoolean(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
  }
  return undefined;
}

function optionalNumber(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}
