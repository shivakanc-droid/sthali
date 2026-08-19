/** Frozen V0 benchmark suite catalog (OpenAI/Anthropic release-post intersection + core agentic evals). */

export const BENCHMARK_SUITE_IDS = [
  "swe-bench-verified",
  "terminal-bench",
  "gpqa-diamond",
  "hle",
  "aime",
  "swe-bench-pro",
  "aider-polyglot",
  "mmmu",
  "osworld",
  "gdpval-aa"
] as const;

export type BenchmarkSuiteId = (typeof BENCHMARK_SUITE_IDS)[number];

export type BenchmarkSuiteDef = {
  id: BenchmarkSuiteId;
  label: string;
  category: "coding" | "agentic_coding" | "science" | "math" | "reasoning" | "multimodal" | "computer_use" | "knowledge_work";
  higher_is_better: boolean;
  unit: "percent" | "elo" | "score";
  core: boolean;
  description: string;
};

export const BENCHMARK_SUITES: BenchmarkSuiteDef[] = [
  {
    id: "swe-bench-verified",
    label: "SWE-bench Verified",
    category: "coding",
    higher_is_better: true,
    unit: "percent",
    core: true,
    description: "Real GitHub issue resolution rate on the Verified subset."
  },
  {
    id: "terminal-bench",
    label: "Terminal-Bench",
    category: "agentic_coding",
    higher_is_better: true,
    unit: "percent",
    core: true,
    description: "Agentic terminal / coding harness tasks (version in suite_version)."
  },
  {
    id: "gpqa-diamond",
    label: "GPQA Diamond",
    category: "science",
    higher_is_better: true,
    unit: "percent",
    core: true,
    description: "PhD-level science Q&A (Diamond split)."
  },
  {
    id: "hle",
    label: "Humanity's Last Exam",
    category: "reasoning",
    higher_is_better: true,
    unit: "percent",
    core: true,
    description: "Hard multidisciplinary reasoning exam."
  },
  {
    id: "aime",
    label: "AIME",
    category: "math",
    higher_is_better: true,
    unit: "percent",
    core: true,
    description: "American Invitational Mathematics Examination (year in suite_version)."
  },
  {
    id: "swe-bench-pro",
    label: "SWE-bench Pro",
    category: "coding",
    higher_is_better: true,
    unit: "percent",
    core: false,
    description: "Harder software engineering issue resolution suite."
  },
  {
    id: "aider-polyglot",
    label: "Aider Polyglot",
    category: "coding",
    higher_is_better: true,
    unit: "percent",
    core: false,
    description: "Multi-language code editing benchmark."
  },
  {
    id: "mmmu",
    label: "MMMU",
    category: "multimodal",
    higher_is_better: true,
    unit: "percent",
    core: false,
    description: "Massive Multi-discipline Multimodal Understanding."
  },
  {
    id: "osworld",
    label: "OSWorld",
    category: "computer_use",
    higher_is_better: true,
    unit: "percent",
    core: false,
    description: "Computer-use / OS agent tasks (Verified variant when noted)."
  },
  {
    id: "gdpval-aa",
    label: "GDPval-AA",
    category: "knowledge_work",
    higher_is_better: true,
    unit: "elo",
    core: false,
    description: "Economically valuable knowledge-work tasks (Artificial Analysis)."
  }
];

export type BenchmarkScoreRow = {
  id: string;
  model_id: string;
  suite: BenchmarkSuiteId;
  suite_version: string | null;
  metric: string;
  value: number;
  unit: string;
  higher_is_better: boolean;
  benchmark_provider_id: string;
  benchmark_provider_name: string;
  harness: string | null;
  source_url: string | null;
  as_of: string;
  submitted_by_agent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BenchmarkLeaderboardEntry = BenchmarkScoreRow & {
  model_name: string | null;
  lab: string | null;
};

export function isBenchmarkSuiteId(value: string): value is BenchmarkSuiteId {
  return (BENCHMARK_SUITE_IDS as readonly string[]).includes(value);
}

export function getBenchmarkSuite(id: string): BenchmarkSuiteDef | null {
  return BENCHMARK_SUITES.find((suite) => suite.id === id) ?? null;
}

export function listBenchmarkSuites(options?: { core_only?: boolean }) {
  if (options?.core_only) return BENCHMARK_SUITES.filter((suite) => suite.core);
  return BENCHMARK_SUITES;
}

function mapScoreRow(row: Record<string, unknown>): BenchmarkScoreRow {
  return {
    id: String(row.id),
    model_id: String(row.model_id),
    suite: String(row.suite) as BenchmarkSuiteId,
    suite_version: row.suite_version == null ? null : String(row.suite_version),
    metric: String(row.metric ?? "score"),
    value: Number(row.value),
    unit: String(row.unit ?? "percent"),
    higher_is_better: Number(row.higher_is_better) !== 0,
    benchmark_provider_id: String(row.benchmark_provider_id),
    benchmark_provider_name: String(row.benchmark_provider_name),
    harness: row.harness == null ? null : String(row.harness),
    source_url: row.source_url == null ? null : String(row.source_url),
    as_of: String(row.as_of),
    submitted_by_agent_id: row.submitted_by_agent_id == null ? null : String(row.submitted_by_agent_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export async function listBenchmarksForModel(db: D1Database, modelId: string) {
  const result = await db
    .prepare(
      `SELECT *
       FROM model_benchmark_scores
       WHERE model_id = ?
       ORDER BY suite ASC, as_of DESC, updated_at DESC`
    )
    .bind(modelId.trim())
    .all();

  return (result.results ?? []).map((row) => mapScoreRow(row as Record<string, unknown>));
}

export async function listBenchmarkLeaderboard(
  db: D1Database,
  options: {
    suite: BenchmarkSuiteId;
    q?: string;
    lab?: string;
    benchmark_provider?: string;
    page?: number;
    page_size?: number;
  }
) {
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(options.page_size ?? 25)));
  const offset = (page - 1) * pageSize;
  const suite = options.suite;
  const q = options.q?.trim().toLowerCase() ?? "";
  const lab = options.lab?.trim().toLowerCase() ?? "";
  const provider = options.benchmark_provider?.trim().toLowerCase() ?? "";

  const suiteDef = getBenchmarkSuite(suite);
  const higherIsBetter = suiteDef?.higher_is_better ?? true;

  // Rank latest score per model *after* optional provider filter, so filtering by
  // provider does not hide an older score behind a newer score from another provider.
  const all = provider
    ? await db
        .prepare(
          `WITH ranked AS (
             SELECT
               *,
               ROW_NUMBER() OVER (
                 PARTITION BY model_id
                 ORDER BY as_of DESC, updated_at DESC
               ) AS rn
             FROM model_benchmark_scores
             WHERE suite = ?
               AND (
                 lower(benchmark_provider_id) = ?
                 OR instr(lower(benchmark_provider_name), ?) > 0
               )
           )
           SELECT * FROM ranked WHERE rn = 1`
        )
        .bind(suite, provider, provider)
        .all()
    : await db
        .prepare(
          `WITH ranked AS (
             SELECT
               *,
               ROW_NUMBER() OVER (
                 PARTITION BY model_id
                 ORDER BY as_of DESC, updated_at DESC
               ) AS rn
             FROM model_benchmark_scores
             WHERE suite = ?
           )
           SELECT * FROM ranked WHERE rn = 1`
        )
        .bind(suite)
        .all();

  let rows = (all.results ?? []).map((row) => mapScoreRow(row as Record<string, unknown>));

  if (q) {
    rows = rows.filter((row) => row.model_id.toLowerCase().includes(q));
  }

  if (lab) {
    rows = rows.filter((row) => {
      const inferredLab = row.model_id.includes("/") ? row.model_id.slice(0, row.model_id.indexOf("/")) : "";
      return inferredLab.toLowerCase() === lab || row.model_id.toLowerCase().includes(lab);
    });
  }

  rows.sort((a, b) => (higherIsBetter ? b.value - a.value : a.value - b.value));

  const total = rows.length;
  const pageRows = rows.slice(offset, offset + pageSize).map((row) => {
    const slash = row.model_id.indexOf("/");
    return {
      ...row,
      model_name: slash >= 0 ? row.model_id.slice(slash + 1) : row.model_id,
      lab: slash >= 0 ? row.model_id.slice(0, slash) : null
    } satisfies BenchmarkLeaderboardEntry;
  });

  return {
    suite,
    suite_meta: suiteDef,
    page,
    page_size: pageSize,
    total,
    has_more: offset + pageRows.length < total,
    models: pageRows
  };
}

export type SubmitBenchmarkInput = {
  model_id: string;
  suite: BenchmarkSuiteId;
  suite_version?: string | null;
  metric?: string;
  value: number;
  unit?: string;
  higher_is_better?: boolean;
  benchmark_provider_id: string;
  benchmark_provider_name: string;
  harness?: string | null;
  source_url?: string | null;
  as_of: string;
  submitted_by_agent_id?: string | null;
};

export async function upsertBenchmarkScore(
  db: D1Database,
  input: SubmitBenchmarkInput,
  createId: () => string
) {
  const modelId = input.model_id.trim();
  if (!modelId) throw new Error("model_id is required");
  if (!isBenchmarkSuiteId(input.suite)) throw new Error(`Unknown suite. Frozen suites: ${BENCHMARK_SUITE_IDS.join(", ")}`);
  if (!Number.isFinite(input.value)) throw new Error("value must be a finite number");

  const suiteDef = getBenchmarkSuite(input.suite)!;
  const now = new Date().toISOString();
  const suiteVersion = input.suite_version?.trim() || null;
  const metric = (input.metric?.trim() || "score").slice(0, 80);
  const providerId = input.benchmark_provider_id.trim().slice(0, 120);
  const providerName = input.benchmark_provider_name.trim().slice(0, 160);
  if (!providerId || !providerName) throw new Error("benchmark_provider_id and benchmark_provider_name are required");

  const asOf = input.as_of.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(asOf)) throw new Error("as_of must be an ISO date (YYYY-MM-DD...)");
  const asOfDay = asOf.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (asOfDay > today) throw new Error("as_of cannot be in the future");

  const existing = await db
    .prepare(
      `SELECT id, created_at FROM model_benchmark_scores
       WHERE model_id = ?
         AND suite = ?
         AND IFNULL(suite_version, '') = IFNULL(?, '')
         AND metric = ?
         AND benchmark_provider_id = ?
         AND as_of = ?
       LIMIT 1`
    )
    .bind(modelId, input.suite, suiteVersion, metric, providerId, asOfDay)
    .first<{ id: string; created_at: string }>();

  const id = existing?.id ?? createId();
  const createdAt = existing?.created_at ?? now;
  const unit = (input.unit?.trim() || suiteDef.unit).slice(0, 40);
  const higher = input.higher_is_better ?? suiteDef.higher_is_better;

  await db
    .prepare(
      `INSERT INTO model_benchmark_scores (
         id, model_id, suite, suite_version, metric, value, unit, higher_is_better,
         benchmark_provider_id, benchmark_provider_name, harness, source_url, as_of,
         submitted_by_agent_id, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         value = excluded.value,
         unit = excluded.unit,
         higher_is_better = excluded.higher_is_better,
         benchmark_provider_name = excluded.benchmark_provider_name,
         harness = excluded.harness,
         source_url = excluded.source_url,
         submitted_by_agent_id = excluded.submitted_by_agent_id,
         updated_at = excluded.updated_at`
    )
    .bind(
      id,
      modelId,
      input.suite,
      suiteVersion,
      metric,
      input.value,
      unit,
      higher ? 1 : 0,
      providerId,
      providerName,
      input.harness?.trim() || null,
      input.source_url?.trim() || null,
      asOfDay,
      input.submitted_by_agent_id ?? null,
      createdAt,
      now
    )
    .run();

  const row = await db.prepare(`SELECT * FROM model_benchmark_scores WHERE id = ?`).bind(id).first();
  return mapScoreRow(row as Record<string, unknown>);
}
