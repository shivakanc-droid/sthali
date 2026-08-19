export type UtilityAgentDefinition = {
  id: string;
  slug: string;
  address: string;
  displayName: string;
  category: string;
  intent: string;
  purpose: string;
  description: string;
  source: string;
  examplePayload: Record<string, unknown>;
};

export const utilityAgents = [
  {
    id: "agt_utility_word_counter",
    slug: "word-counter-agent",
    address: "word-counter-agent@sthali.com",
    displayName: "Word Counter Agent",
    category: "text",
    intent: "count_words",
    purpose: "Counts words and related text metrics from supplied text.",
    description: "Sthali-managed deterministic text agent. It returns word, character, byte, line, paragraph, sentence, reading-time, and speaking-time metrics without retaining the submitted text.",
    source: "Sthali deterministic text analysis",
    examplePayload: { text: "Sthali agents exchange structured work." }
  },
  {
    id: "agt_utility_number_to_words",
    slug: "number-to-words-agent",
    address: "number-to-words-agent@sthali.com",
    displayName: "Number-to-Words Converter Agent",
    category: "text",
    intent: "convert_number_to_words",
    purpose: "Converts integers, decimals, and currency amounts into English words.",
    description: "Sthali-managed deterministic text agent. It converts signed decimal strings without floating-point precision loss and can format supported currency major and minor units.",
    source: "Sthali deterministic English number formatting",
    examplePayload: { value: "1234.56", currency: "USD" }
  }
] as const satisfies readonly UtilityAgentDefinition[];

export type UtilityAgentId = (typeof utilityAgents)[number]["id"];

export function getUtilityAgentById(id: string): UtilityAgentDefinition | null {
  return utilityAgents.find((agent) => agent.id === id) ?? null;
}

export function getUtilityAgentBySlug(slug: string): UtilityAgentDefinition | null {
  return utilityAgents.find((agent) => agent.slug === slug) ?? null;
}

export function isUtilityAgentId(id: string): id is UtilityAgentId {
  return utilityAgents.some((agent) => agent.id === id);
}

export function utilityAgentResponse(
  agentId: UtilityAgentId,
  intent: string,
  payload: Record<string, unknown>
) {
  if (agentId === "agt_utility_word_counter") {
    return wordCounterResponse(intent, payload);
  }
  if (agentId === "agt_utility_number_to_words") {
    return numberToWordsResponse(intent, payload);
  }

  return {
    ok: false,
    intent,
    error: "Unsupported utility agent",
    generated_at: new Date().toISOString()
  };
}

export function wordCounterResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[0];
  if (intent !== agent.intent) {
    return utilityError(agent, intent, `Unsupported intent. Use ${agent.intent}.`);
  }

  const text = payload.text;
  if (typeof text !== "string") {
    return utilityError(agent, intent, "payload.text must be a string");
  }
  if (text.length > 200_000) {
    return utilityError(agent, intent, "payload.text must not exceed 200000 characters");
  }

  const words = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [];
  const trimmed = text.trim();
  const paragraphs = trimmed ? trimmed.split(/(?:\r?\n){2,}/).filter((part) => part.trim()).length : 0;
  const sentences = trimmed
    ? (trimmed.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []).filter((part) => /[\p{L}\p{N}]/u.test(part)).length
    : 0;
  const wordCount = words.length;

  return {
    ok: true,
    intent,
    source_agent: agent.address,
    source: agent.source,
    metrics: {
      words: wordCount,
      unique_words: new Set(words.map((word) => word.toLocaleLowerCase("en"))).size,
      characters: text.length,
      characters_without_whitespace: text.replace(/\s/gu, "").length,
      bytes_utf8: new TextEncoder().encode(text).byteLength,
      lines: text.length ? text.split(/\r\n|\r|\n/).length : 0,
      paragraphs,
      sentences,
      reading_time_minutes: round(wordCount / 200, 2),
      speaking_time_minutes: round(wordCount / 130, 2)
    },
    assumptions: {
      reading_speed_words_per_minute: 200,
      speaking_speed_words_per_minute: 130,
      word_rule: "Unicode letters or numbers with optional internal apostrophes or hyphens"
    },
    generated_at: new Date().toISOString()
  };
}

export function numberToWordsResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[1];
  if (intent !== agent.intent) {
    return utilityError(agent, intent, `Unsupported intent. Use ${agent.intent}.`);
  }

  const rawValue = payload.value;
  if (typeof rawValue !== "string" && typeof rawValue !== "number") {
    return utilityError(agent, intent, "payload.value must be a decimal string or finite number");
  }
  const value = String(rawValue).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(value) || (typeof rawValue === "number" && !Number.isFinite(rawValue))) {
    return utilityError(agent, intent, "payload.value must be a plain finite decimal value");
  }

  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integerDigitsRaw, fractionDigits = ""] = unsigned.split(".");
  const integerDigits = integerDigitsRaw.replace(/^0+(?=\d)/, "");
  if (integerDigits.length > 18) {
    return utilityError(agent, intent, "payload.value supports at most 18 integer digits");
  }

  const integer = BigInt(integerDigits);
  const prefix = negative && (integer !== 0n || /[1-9]/.test(fractionDigits)) ? "minus " : "";
  const currencyCode = typeof payload.currency === "string" ? payload.currency.trim().toUpperCase() : "";
  let words: string;

  if (currencyCode) {
    const currency = currencies[currencyCode];
    if (!currency) return utilityError(agent, intent, `Unsupported currency. Use ${Object.keys(currencies).join(", ")}.`);
    if (fractionDigits.length > 2) return utilityError(agent, intent, "Currency values support at most two decimal places");
    const minor = BigInt((fractionDigits + "00").slice(0, 2));
    const majorLabel = integer === 1n ? currency.major[0] : currency.major[1];
    const minorLabel = minor === 1n ? currency.minor[0] : currency.minor[1];
    words = `${prefix}${integerToEnglish(integer)} ${majorLabel} and ${integerToEnglish(minor)} ${minorLabel}`;
  } else {
    const decimalWords = fractionDigits
      ? ` point ${[...fractionDigits].map((digit) => smallNumbers[Number(digit)]).join(" ")}`
      : "";
    words = `${prefix}${integerToEnglish(integer)}${decimalWords}`;
  }

  return {
    ok: true,
    intent,
    source_agent: agent.address,
    source: agent.source,
    input: value,
    currency: currencyCode || null,
    words,
    generated_at: new Date().toISOString()
  };
}

const smallNumbers = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
] as const;
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"] as const;
const scales = ["", "thousand", "million", "billion", "trillion", "quadrillion", "quintillion"] as const;
const currencies: Record<string, { major: [string, string]; minor: [string, string] }> = {
  USD: { major: ["dollar", "dollars"], minor: ["cent", "cents"] },
  EUR: { major: ["euro", "euros"], minor: ["cent", "cents"] },
  GBP: { major: ["pound", "pounds"], minor: ["penny", "pence"] },
  INR: { major: ["rupee", "rupees"], minor: ["paise", "paise"] }
};

function integerToEnglish(value: bigint) {
  if (value === 0n) return "zero";
  const parts: string[] = [];
  let remaining = value;
  let scale = 0;
  while (remaining > 0n) {
    const chunk = Number(remaining % 1000n);
    if (chunk) {
      const label = scales[scale];
      parts.unshift(`${underThousandToEnglish(chunk)}${label ? ` ${label}` : ""}`);
    }
    remaining /= 1000n;
    scale += 1;
  }
  return parts.join(" ");
}

function underThousandToEnglish(value: number) {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  if (hundreds) parts.push(`${smallNumbers[hundreds]} hundred`);
  if (remainder < 20 && remainder) parts.push(smallNumbers[remainder]);
  if (remainder >= 20) {
    const ones = remainder % 10;
    parts.push(`${tens[Math.floor(remainder / 10)]}${ones ? `-${smallNumbers[ones]}` : ""}`);
  }
  return parts.join(" ");
}

function utilityError(agent: UtilityAgentDefinition, intent: string, error: string) {
  return {
    ok: false,
    intent,
    error,
    source_agent: agent.address,
    source: agent.source,
    generated_at: new Date().toISOString()
  };
}

function round(value: number, places: number) {
  const scale = 10 ** places;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}
