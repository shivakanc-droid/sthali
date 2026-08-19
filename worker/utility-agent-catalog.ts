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
  },
  {
    id: "agt_utility_text_diff", slug: "text-diff-checker-agent", address: "text-diff-checker-agent@sthali.com",
    displayName: "Text Diff Checker Agent", category: "text", intent: "compare_text",
    purpose: "Compares two text blocks line by line and identifies unchanged, added, and removed lines.",
    description: "Sthali-managed deterministic line-diff agent using a bounded longest-common-subsequence comparison.",
    source: "Sthali bounded line diff", examplePayload: { before: "alpha\nbeta", after: "alpha\ngamma" }
  },
  {
    id: "agt_utility_lorem_ipsum", slug: "lorem-ipsum-generator-agent", address: "lorem-ipsum-generator-agent@sthali.com",
    displayName: "Lorem Ipsum Generator Agent", category: "text", intent: "generate_lorem_ipsum",
    purpose: "Generates deterministic placeholder words, sentences, or paragraphs.",
    description: "Sthali-managed placeholder-text generator with explicit unit and count limits for reproducible output.",
    source: "Sthali deterministic placeholder corpus", examplePayload: { unit: "paragraphs", count: 2 }
  },
  {
    id: "agt_utility_remove_duplicate_lines", slug: "remove-duplicate-lines-agent", address: "remove-duplicate-lines-agent@sthali.com",
    displayName: "Remove Duplicate Lines Agent", category: "text", intent: "remove_duplicate_lines",
    purpose: "Removes repeated lines while preserving first-seen order.",
    description: "Sthali-managed deterministic line deduplicator with trim, case-sensitivity, and empty-line controls.",
    source: "Sthali deterministic text transformation", examplePayload: { text: "alpha\nbeta\nalpha", trim: true, case_sensitive: true }
  },
  {
    id: "agt_utility_slug_generator", slug: "slug-generator-agent", address: "slug-generator-agent@sthali.com",
    displayName: "Slug Generator Agent", category: "text", intent: "generate_slugs",
    purpose: "Converts one title or a list of titles into normalized URL slugs.",
    description: "Sthali-managed deterministic slug generator with Unicode normalization and configurable hyphen or underscore separators.",
    source: "Sthali deterministic URL slug rules", examplePayload: { items: ["Hello, Sthali!", "Agent Exchange"] }
  },
  {
    id: "agt_utility_markdown_table", slug: "markdown-table-generator-agent", address: "markdown-table-generator-agent@sthali.com",
    displayName: "Markdown Table Generator Agent", category: "text", intent: "generate_markdown_table",
    purpose: "Converts structured rows, CSV, or tab-separated text into a Markdown table.",
    description: "Sthali-managed deterministic table generator with quoted-delimiter parsing, cell escaping, and alignment controls.",
    source: "Sthali deterministic tabular text conversion", examplePayload: { rows: [["Name", "Role"], ["Sthali", "Exchange"]], header: true }
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
  if (agentId === "agt_utility_text_diff") return textDiffResponse(intent, payload);
  if (agentId === "agt_utility_lorem_ipsum") return loremIpsumResponse(intent, payload);
  if (agentId === "agt_utility_remove_duplicate_lines") return removeDuplicateLinesResponse(intent, payload);
  if (agentId === "agt_utility_slug_generator") return slugGeneratorResponse(intent, payload);
  if (agentId === "agt_utility_markdown_table") return markdownTableResponse(intent, payload);

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

export function textDiffResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[7];
  const before = boundedText(agent, intent, payload.before, "before", 100_000);
  if (typeof before !== "string") return before;
  const after = boundedText(agent, intent, payload.after, "after", 100_000);
  if (typeof after !== "string") return after;
  const beforeLines = splitLines(before);
  const afterLines = splitLines(after);
  if (beforeLines.length > 500 || afterLines.length > 500 || beforeLines.length * afterLines.length > 250_000) {
    return utilityError(agent, intent, "Diff supports at most 500 lines per side and 250000 line comparisons");
  }
  const operations = diffLines(beforeLines, afterLines);
  return utilitySuccess(agent, intent, {
    operations,
    summary: {
      unchanged: operations.filter((item) => item.type === "equal").length,
      added: operations.filter((item) => item.type === "add").length,
      removed: operations.filter((item) => item.type === "remove").length
    }
  });
}

export function loremIpsumResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[8];
  if (intent !== agent.intent) return utilityError(agent, intent, `Unsupported intent. Use ${agent.intent}.`);
  const unit = typeof payload.unit === "string" ? payload.unit : "paragraphs";
  const count = integerPayload(payload.count, 1);
  const offset = integerPayload(payload.seed_offset, 0);
  if (!['words', 'sentences', 'paragraphs'].includes(unit)) return utilityError(agent, intent, "payload.unit must be words, sentences, or paragraphs");
  const max = unit === "words" ? 1000 : unit === "sentences" ? 200 : 50;
  if (count < 1 || count > max || offset < 0 || offset > 10_000) return utilityError(agent, intent, `payload.count must be between 1 and ${max}; seed_offset must be 0..10000`);
  const sentencesPerParagraph = integerPayload(payload.sentences_per_paragraph, 5);
  if (sentencesPerParagraph < 1 || sentencesPerParagraph > 20) return utilityError(agent, intent, "sentences_per_paragraph must be between 1 and 20");
  let cursor = offset;
  const takeWords = (amount: number) => Array.from({ length: amount }, () => loremWords[(cursor++) % loremWords.length]);
  const sentence = () => `${capitalize(takeWords(12).join(" "))}.`;
  const output = unit === "words"
    ? takeWords(count).join(" ")
    : unit === "sentences"
      ? Array.from({ length: count }, sentence).join(" ")
      : Array.from({ length: count }, () => Array.from({ length: sentencesPerParagraph }, sentence).join(" ")).join("\n\n");
  return utilitySuccess(agent, intent, { unit, count, seed_offset: offset, output });
}

export function removeDuplicateLinesResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[9];
  const text = boundedText(agent, intent, payload.text, "text");
  if (typeof text !== "string") return text;
  const trim = payload.trim !== false;
  const caseSensitive = payload.case_sensitive !== false;
  const keepEmpty = payload.keep_empty !== false;
  const seen = new Set<string>();
  const output: string[] = [];
  for (const original of splitLines(text)) {
    const line = trim ? original.trim() : original;
    if (!keepEmpty && !line) continue;
    const key = caseSensitive ? line : line.toLocaleLowerCase("en");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(line);
  }
  return utilitySuccess(agent, intent, {
    output: output.join("\n"),
    input_lines: splitLines(text).length,
    output_lines: output.length,
    removed_lines: splitLines(text).length - output.length,
    options: { trim, case_sensitive: caseSensitive, keep_empty: keepEmpty }
  });
}

export function slugGeneratorResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[10];
  if (intent !== agent.intent) return utilityError(agent, intent, `Unsupported intent. Use ${agent.intent}.`);
  const separator = payload.separator === "_" ? "_" : "-";
  const rawItems = Array.isArray(payload.items) ? payload.items : typeof payload.text === "string" ? [payload.text] : null;
  if (!rawItems || !rawItems.length || rawItems.length > 500 || rawItems.some((item) => typeof item !== "string")) {
    return utilityError(agent, intent, "Provide payload.text or 1..500 string payload.items");
  }
  const stringItems: string[] = [];
  for (const item of rawItems) if (typeof item === "string") stringItems.push(item);
  const items = stringItems.map((input) => ({ input, slug: toSlug(input, separator) }));
  if (items.some((item) => !item.slug)) return utilityError(agent, intent, "Every item must contain at least one Latin letter or digit after normalization");
  return utilitySuccess(agent, intent, { separator, items, output: items.map((item) => item.slug).join("\n") });
}

export function markdownTableResponse(intent: string, payload: Record<string, unknown>) {
  const agent = utilityAgents[11];
  if (intent !== agent.intent) return utilityError(agent, intent, `Unsupported intent. Use ${agent.intent}.`);
  let rows: string[][];
  if (Array.isArray(payload.rows)) {
    if (!payload.rows.every((row) => Array.isArray(row))) return utilityError(agent, intent, "payload.rows must be an array of arrays");
    rows = payload.rows.map((row) => (row as unknown[]).map((cell) => cell == null ? "" : typeof cell === "object" ? JSON.stringify(cell) : String(cell)));
  } else if (typeof payload.text === "string") {
    if (payload.text.length > 200_000) return utilityError(agent, intent, "payload.text must not exceed 200000 characters");
    const delimiter = payload.delimiter === "tab" ? "\t" : typeof payload.delimiter === "string" && payload.delimiter.length === 1 ? payload.delimiter : ",";
    try {
      rows = parseDelimited(payload.text, delimiter);
    } catch (error) {
      return utilityError(agent, intent, error instanceof Error ? error.message : "Invalid delimited text");
    }
  } else {
    return utilityError(agent, intent, "Provide payload.rows or delimited payload.text");
  }
  if (!rows.length || rows.length > 200) return utilityError(agent, intent, "Table must contain 1..200 rows");
  const columns = Math.max(...rows.map((row) => row.length));
  if (!columns || columns > 50) return utilityError(agent, intent, "Table must contain 1..50 columns");
  rows = rows.map((row) => [...row, ...Array(columns - row.length).fill("")]);
  const hasHeader = payload.header !== false;
  const header = hasHeader ? rows[0] : Array.from({ length: columns }, (_, index) => `Column ${index + 1}`);
  const body = hasHeader ? rows.slice(1) : rows;
  const alignments = Array.isArray(payload.alignments) ? payload.alignments : [];
  const divider = header.map((_, index) => alignments[index] === "center" ? ":---:" : alignments[index] === "right" ? "---:" : ":---");
  const markdownRows = [header, divider, ...body].map((row) => `| ${row.map(escapeMarkdownCell).join(" | ")} |`);
  return utilitySuccess(agent, intent, { rows: rows.length, columns, header: hasHeader, markdown: markdownRows.join("\n") });
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

function boundedText(agent: UtilityAgentDefinition, intent: string, value: unknown, field: string, maxLength = 200_000) {
  if (intent !== agent.intent) return utilityError(agent, intent, `Unsupported intent. Use ${agent.intent}.`);
  if (typeof value !== "string") return utilityError(agent, intent, `payload.${field} must be a string`);
  if (value.length > maxLength) return utilityError(agent, intent, `payload.${field} must not exceed ${maxLength} characters`);
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

function splitLines(value: string) {
  return value.length ? value.replace(/\r\n?/g, "\n").split("\n") : [];
}

function diffLines(before: string[], after: string[]) {
  const table = Array.from({ length: before.length + 1 }, () => new Uint16Array(after.length + 1));
  for (let i = 1; i <= before.length; i += 1) {
    for (let j = 1; j <= after.length; j += 1) {
      table[i][j] = before[i - 1] === after[j - 1]
        ? table[i - 1][j - 1] + 1
        : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  const operations: Array<{ type: "equal" | "add" | "remove"; line: string; before_line: number | null; after_line: number | null }> = [];
  let i = before.length;
  let j = after.length;
  while (i || j) {
    if (i && j && before[i - 1] === after[j - 1]) {
      operations.unshift({ type: "equal", line: before[i - 1], before_line: i, after_line: j }); i -= 1; j -= 1;
    } else if (j && (!i || table[i][j - 1] >= table[i - 1][j])) {
      operations.unshift({ type: "add", line: after[j - 1], before_line: null, after_line: j }); j -= 1;
    } else {
      operations.unshift({ type: "remove", line: before[i - 1], before_line: i, after_line: null }); i -= 1;
    }
  }
  return operations;
}

const loremWords = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

function integerPayload(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function toSlug(value: string, separator: "-" | "_") {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, separator).replace(new RegExp(`^\\${separator}+|\\${separator}+$`, "g"), "")
    .replace(new RegExp(`\\${separator}{2,}`, "g"), separator);
}

function parseDelimited(value: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quoted && char === '"' && value[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === delimiter) { row.push(cell); cell = ""; }
    else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && value[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("Delimited text contains an unclosed quoted field");
  row.push(cell);
  if (row.length > 1 || row[0] || !rows.length) rows.push(row);
  return rows;
}

function escapeMarkdownCell(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
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
