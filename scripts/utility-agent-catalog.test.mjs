import assert from "node:assert/strict";
import test from "node:test";

import {
  getUtilityAgentById,
  getUtilityAgentBySlug,
  isUtilityAgentId,
  numberToWordsResponse,
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
