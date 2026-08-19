import assert from "node:assert/strict";
import test from "node:test";

import {
  BENCHMARK_SUITE_IDS,
  getBenchmarkSuite,
  isBenchmarkSuiteId,
  listBenchmarkSuites
} from "../worker/benchmark-catalog.ts";

test("frozen suite ids are unique and resolvable", () => {
  assert.equal(new Set(BENCHMARK_SUITE_IDS).size, BENCHMARK_SUITE_IDS.length);
  for (const id of BENCHMARK_SUITE_IDS) {
    assert.equal(isBenchmarkSuiteId(id), true);
    assert.equal(getBenchmarkSuite(id)?.id, id);
  }
  assert.equal(isBenchmarkSuiteId("not-a-suite"), false);
  assert.equal(getBenchmarkSuite("not-a-suite"), null);
});

test("core_only filters secondary suites", () => {
  const core = listBenchmarkSuites({ core_only: true });
  const all = listBenchmarkSuites();
  assert.ok(core.length > 0);
  assert.ok(core.length < all.length);
  assert.ok(core.every((suite) => suite.core));
  assert.ok(core.some((suite) => suite.id === "swe-bench-verified"));
  assert.ok(all.some((suite) => suite.id === "gdpval-aa" && !suite.core));
});

test("upsertBenchmarkScore validates as_of and finite values without D1", async () => {
  const { upsertBenchmarkScore } = await import("../worker/benchmark-catalog.ts");

  const fakeDb = {
    prepare() {
      throw new Error("db should not be reached for validation failures");
    }
  };

  await assert.rejects(
    () =>
      upsertBenchmarkScore(
        fakeDb,
        {
          model_id: "openai/gpt-5",
          suite: "swe-bench-verified",
          value: Number.NaN,
          benchmark_provider_id: "x",
          benchmark_provider_name: "X",
          as_of: "2026-01-01"
        },
        () => "bmk_x"
      ),
    /finite number/
  );

  await assert.rejects(
    () =>
      upsertBenchmarkScore(
        fakeDb,
        {
          model_id: "openai/gpt-5",
          suite: "swe-bench-verified",
          value: 1,
          benchmark_provider_id: "x",
          benchmark_provider_name: "X",
          as_of: "2099-01-01"
        },
        () => "bmk_x"
      ),
    /future/
  );

  await assert.rejects(
    () =>
      upsertBenchmarkScore(
        fakeDb,
        {
          model_id: "openai/gpt-5",
          suite: "swe-bench-verified",
          value: 1,
          benchmark_provider_id: "",
          benchmark_provider_name: "X",
          as_of: "2026-01-01"
        },
        () => "bmk_x"
      ),
    /benchmark_provider/
  );
});
