import assert from "node:assert/strict";
import test from "node:test";

import {
  caseConverterResponse,
  characterCounterResponse,
  getUtilityAgentById,
  getUtilityAgentBySlug,
  isUtilityAgentId,
  loremIpsumResponse,
  markdownPreviewResponse,
  markdownTableResponse,
  numberToWordsResponse,
  readabilityResponse,
  removeDuplicateLinesResponse,
  romanNumeralResponse,
  slugGeneratorResponse,
  textDiffResponse,
  utilityAgents,
  wordCounterResponse
} from "../worker/utility-agent-catalog.ts";

test("utility agent ids, slugs, addresses, and intents are unique", () => {
  for (const key of ["id", "slug", "address", "intent"]) {
    assert.equal(new Set(utilityAgents.map((agent) => agent[key])).size, utilityAgents.length);
  }
  const agent = utilityAgents[0];
  assert.equal(getUtilityAgentById(agent.id)?.address, agent.address);
  assert.equal(getUtilityAgentBySlug(agent.slug)?.id, agent.id);
  assert.equal(isUtilityAgentId(agent.id), true);
  assert.equal(isUtilityAgentId("agt_missing"), false);
});

test("five additional text agents execute bounded end-to-end payload contracts", () => {
  const diff = textDiffResponse("compare_text", { before: "alpha\nbeta", after: "alpha\ngamma" });
  assert.deepEqual(diff.summary, { unchanged: 1, added: 1, removed: 1 });
  assert.equal(diff.operations.map((item) => item.type).join(","), "equal,remove,add");

  const lorem = loremIpsumResponse("generate_lorem_ipsum", { unit: "sentences", count: 2, seed_offset: 0 });
  assert.equal(lorem.ok, true);
  assert.equal(lorem.output.split(". ").length, 2);
  assert.equal(lorem.output, loremIpsumResponse("generate_lorem_ipsum", { unit: "sentences", count: 2, seed_offset: 0 }).output);

  const deduplicated = removeDuplicateLinesResponse("remove_duplicate_lines", { text: " Alpha \nbeta\nalpha", case_sensitive: false });
  assert.equal(deduplicated.output, "Alpha\nbeta");
  assert.equal(deduplicated.removed_lines, 1);

  const slugs = slugGeneratorResponse("generate_slugs", { items: ["Café Sthali", "Agent Exchange"], separator: "-" });
  assert.deepEqual(slugs.items.map((item) => item.slug), ["cafe-sthali", "agent-exchange"]);

  const table = markdownTableResponse("generate_markdown_table", { text: 'Name,Note\nSthali,"Agent | exchange"' });
  assert.equal(table.ok, true);
  assert.match(table.markdown, /Agent \\| exchange/);
  assert.equal(markdownTableResponse("generate_markdown_table", { text: 'a,"broken' }).ok, false);
});

test("next five text agents execute their distinct deterministic contracts", () => {
  const characters = characterCounterResponse("count_characters", { text: "A 👋" });
  assert.equal(characters.metrics.characters, 3);
  assert.equal(characters.metrics.utf16_code_units, 4);

  assert.equal(romanNumeralResponse("convert_roman_numeral", { value: 1994 }).roman, "MCMXCIV");
  assert.equal(romanNumeralResponse("convert_roman_numeral", { value: "MCMXCIV" }).integer, 1994);
  assert.equal(romanNumeralResponse("convert_roman_numeral", { value: "IIII" }).ok, false);

  const markdown = markdownPreviewResponse("render_markdown_preview", { markdown: "# Hi\n\n**Safe** <script>x</script>" });
  assert.match(markdown.html, /<h1>Hi<\/h1>/);
  assert.match(markdown.html, /<strong>Safe<\/strong> &lt;script&gt;/);
  assert.doesNotMatch(markdown.html, /<script>/);

  assert.equal(caseConverterResponse("convert_text_case", { text: "Hello Sthali Agent", mode: "snake" }).output, "hello_sthali_agent");
  const readability = readabilityResponse("check_readability", { text: "Clear writing helps readers. Short sentences improve understanding." });
  assert.equal(readability.ok, true);
  assert.equal(readability.metrics.sentences, 2);
  assert.equal(typeof readability.metrics.flesch_reading_ease, "number");
});

test("number-to-words converts decimals and supported currencies without floating-point parsing", () => {
  assert.equal(numberToWordsResponse("convert_number_to_words", { value: "1002003.04" }).words, "one million two thousand three point zero four");
  assert.equal(numberToWordsResponse("convert_number_to_words", { value: "-1234.56", currency: "USD" }).words, "minus one thousand two hundred thirty-four dollars and fifty-six cents");
  assert.equal(numberToWordsResponse("convert_number_to_words", { value: "1.01", currency: "INR" }).words, "one rupee and one paise");
  assert.equal(numberToWordsResponse("wrong", { value: "1" }).ok, false);
  assert.equal(numberToWordsResponse("convert_number_to_words", { value: "1.234", currency: "USD" }).ok, false);
});

test("word counter returns deterministic Unicode-aware text metrics", () => {
  const response = wordCounterResponse("count_words", {
    text: "Hello, world!\n\nHello Sthali-agent."
  });
  assert.equal(response.ok, true);
  assert.deepEqual(response.metrics, {
    words: 4,
    unique_words: 3,
    characters: 34,
    characters_without_whitespace: 30,
    bytes_utf8: 34,
    lines: 3,
    paragraphs: 2,
    sentences: 2,
    reading_time_minutes: 0.02,
    speaking_time_minutes: 0.03
  });
});

test("word counter rejects unsupported intents and invalid or oversized text", () => {
  assert.equal(wordCounterResponse("wrong", { text: "hello" }).ok, false);
  assert.match(wordCounterResponse("count_words", {}).error, /must be a string/);
  assert.match(wordCounterResponse("count_words", { text: "x".repeat(200_001) }).error, /200000/);
});
