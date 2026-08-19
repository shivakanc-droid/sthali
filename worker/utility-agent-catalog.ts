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
  },
  {
    id: "agt_utility_character_counter", slug: "character-counter-agent", address: "character-counter-agent@sthali.com",
    displayName: "Character Counter Agent", category: "text", intent: "count_characters",
    purpose: "Counts Unicode characters, code units, bytes, whitespace, words, and lines.",
    description: "Sthali-managed deterministic character counter with Unicode code-point and UTF-8 byte metrics plus common publishing limits.",
    source: "Sthali deterministic text analysis", examplePayload: { text: "Hello 👋" }
  },
  {
    id: "agt_utility_roman_numeral", slug: "roman-numeral-converter-agent", address: "roman-numeral-converter-agent@sthali.com",
    displayName: "Roman Numeral Converter Agent", category: "text", intent: "convert_roman_numeral",
    purpose: "Converts integers from 1 to 3999 and canonical Roman numerals in either direction.",
    description: "Sthali-managed deterministic Roman numeral converter with strict canonical-input validation.",
    source: "Sthali deterministic Roman numeral rules", examplePayload: { value: "MCMXCIV" }
  },
  {
    id: "agt_utility_markdown_preview", slug: "markdown-preview-agent", address: "markdown-preview-agent@sthali.com",
    displayName: "Markdown Preview Agent", category: "text", intent: "render_markdown_preview",
    purpose: "Renders a conservative Markdown subset into escaped, safe HTML.",
    description: "Sthali-managed Markdown preview agent supporting headings, paragraphs, lists, fenced code, emphasis, inline code, and safe HTTP links while escaping raw HTML.",
    source: "Sthali safe Markdown renderer", examplePayload: { markdown: "# Hello\n\n**Sthali** agent preview." }
  },
  {
    id: "agt_utility_case_converter", slug: "case-converter-agent", address: "case-converter-agent@sthali.com",
    displayName: "Case Converter Agent", category: "text", intent: "convert_text_case",
    purpose: "Converts text to upper, lower, title, sentence, camel, snake, or kebab case.",
    description: "Sthali-managed deterministic case conversion agent with explicit output modes.",
    source: "Sthali deterministic text transformation", examplePayload: { text: "hello sthali agents", mode: "title" }
  },
  {
    id: "agt_utility_readability", slug: "readability-score-agent", address: "readability-score-agent@sthali.com",
    displayName: "Readability Score Checker Agent", category: "text", intent: "check_readability",
    purpose: "Estimates Flesch reading ease, Flesch-Kincaid grade, sentence length, and word complexity.",
    description: "Sthali-managed deterministic English readability estimator using transparent sentence, word, and syllable heuristics.",
    source: "Sthali deterministic readability formulas", examplePayload: { text: "Clear writing helps people understand complex ideas." }
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
  if (agentId === "agt_utility_character_counter") return characterCounterResponse(intent, payload);
  if (agentId === "agt_utility_roman_numeral") return romanNumeralResponse(intent, payload);
  if (agentId === "agt_utility_markdown_preview") return markdownPreviewResponse(intent, payload);
  if (agentId === "agt_utility_case_converter") return caseConverterResponse(intent, payload);
  if (agentId === "agt_utility_readability") return readabilityResponse(intent, payload);

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

export function characterCounterResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[2];
  const text = boundedText(agent, intent, payload.text, "text");
  if (typeof text !== "string") return text;
  const codePoints = [...text].length;
  const words = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return utilitySuccess(agent, intent, {
    metrics: {
      characters: codePoints, utf16_code_units: text.length, bytes_utf8: new TextEncoder().encode(text).byteLength,
      characters_without_whitespace: [...text.replace(/\s/gu, "")].length,
      whitespace: [...text.matchAll(/\s/gu)].length, spaces: [...text.matchAll(/ /g)].length,
      words, lines: text.length ? text.split(/\r\n|\r|\n/).length : 0
    },
    limits: { x_remaining: 280 - codePoints, sms_160_remaining: 160 - codePoints, meta_description_160_remaining: 160 - codePoints }
  });
}

export function romanNumeralResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[3];
  if (intent !== agent.intent) return utilityError(agent, intent, `Unsupported intent. Use ${agent.intent}.`);
  const value = payload.value;
  if (typeof value !== "string" && typeof value !== "number") return utilityError(agent, intent, "payload.value must be an integer or Roman numeral string");
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) {
    const number = Number(raw);
    if (!Number.isInteger(number) || number < 1 || number > 3999) return utilityError(agent, intent, "Integer must be between 1 and 3999");
    return utilitySuccess(agent, intent, { input: raw, direction: "integer_to_roman", integer: number, roman: integerToRoman(number) });
  }
  const roman = raw.toUpperCase();
  const number = romanToInteger(roman);
  if (!number || integerToRoman(number) !== roman) return utilityError(agent, intent, "Roman numeral must be canonical and between I and MMMCMXCIX");
  return utilitySuccess(agent, intent, { input: raw, direction: "roman_to_integer", integer: number, roman });
}

export function markdownPreviewResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[4];
  const markdown = boundedText(agent, intent, payload.markdown, "markdown");
  if (typeof markdown !== "string") return markdown;
  return utilitySuccess(agent, intent, { markdown, html: renderSafeMarkdown(markdown) });
}

export function caseConverterResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[5];
  const text = boundedText(agent, intent, payload.text, "text");
  if (typeof text !== "string") return text;
  const mode = typeof payload.mode === "string" ? payload.mode : "";
  const words = text.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const lowerWords = words.map((word) => word.toLocaleLowerCase("en"));
  const outputs: Record<string, string> = {
    upper: text.toLocaleUpperCase("en"), lower: text.toLocaleLowerCase("en"),
    title: lowerWords.map(capitalize).join(" "),
    sentence: capitalize(text.toLocaleLowerCase("en").trim()),
    camel: lowerWords.map((word, index) => index ? capitalize(word) : word).join(""),
    snake: lowerWords.join("_"), kebab: lowerWords.join("-")
  };
  if (!(mode in outputs)) return utilityError(agent, intent, `payload.mode must be one of: ${Object.keys(outputs).join(", ")}`);
  return utilitySuccess(agent, intent, { mode, input: text, output: outputs[mode] });
}

export function readabilityResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[6];
  const text = boundedText(agent, intent, payload.text, "text");
  if (typeof text !== "string") return text;
  const words = text.toLocaleLowerCase("en").match(/[a-z]+(?:['-][a-z]+)*/g) ?? [];
  const sentences = (text.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []).filter((part) => /[a-z]/i.test(part)).length;
  if (!words.length || !sentences) return utilityError(agent, intent, "payload.text must contain at least one English word and sentence");
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const complexWords = words.filter((word) => countSyllables(word) >= 3).length;
  const ease = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length);
  const grade = 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
  return utilitySuccess(agent, intent, { metrics: {
    words: words.length, sentences, syllables, complex_words: complexWords,
    average_words_per_sentence: round(words.length / sentences, 2),
    average_syllables_per_word: round(syllables / words.length, 2),
    flesch_reading_ease: round(ease, 2), flesch_kincaid_grade: round(Math.max(0, grade), 2)
  }, note: "English estimate using a deterministic syllable heuristic." });
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

function boundedText(agent: UtilityAgentDefinition, intent: string, value: unknown, field: string) {
  if (intent !== agent.intent) return utilityError(agent, intent, `Unsupported intent. Use ${agent.intent}.`);
  if (typeof value !== "string") return utilityError(agent, intent, `payload.${field} must be a string`);
  if (value.length > 200_000) return utilityError(agent, intent, `payload.${field} must not exceed 200000 characters`);
  return value;
}

function utilitySuccess(agent: UtilityAgentDefinition, intent: string, result: Record<string, unknown>) {
  return { ok: true, intent, source_agent: agent.address, source: agent.source, ...result, generated_at: new Date().toISOString() };
}

const romanValues: Array<[number, string]> = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
];

function integerToRoman(value: number) {
  let remaining = value;
  let output = "";
  for (const [amount, numeral] of romanValues) {
    while (remaining >= amount) { output += numeral; remaining -= amount; }
  }
  return output;
}

function romanToInteger(value: string) {
  let total = 0;
  let index = 0;
  for (const [amount, numeral] of romanValues) {
    while (value.slice(index, index + numeral.length) === numeral) { total += amount; index += numeral.length; }
  }
  return index === value.length ? total : 0;
}

function renderSafeMarkdown(markdown: string) {
  const escaped = escapeHtml(markdown.replace(/\r\n?/g, "\n"));
  const blocks = escaped.split(/\n{2,}/);
  return blocks.map((block) => {
    if (/^```/.test(block) && /```$/.test(block)) return `<pre><code>${block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "")}</code></pre>`;
    const heading = block.match(/^(#{1,6})\s+(.+)$/s);
    if (heading) return `<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`;
    const lines = block.split("\n");
    if (lines.every((line) => /^[-*]\s+/.test(line))) return `<ul>${lines.map((line) => `<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    return `<p>${inlineMarkdown(block).replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
}

function inlineMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="nofollow noopener">$1</a>');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function capitalize(value: string) {
  return value ? value[0].toLocaleUpperCase("en") + value.slice(1) : value;
}

function countSyllables(value: string) {
  const word = value.replace(/[^a-z]/g, "").replace(/e$/, "");
  return Math.max(1, word.match(/[aeiouy]+/g)?.length ?? 0);
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
