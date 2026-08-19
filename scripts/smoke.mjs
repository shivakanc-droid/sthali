import { lookup as systemLookup, setDefaultResultOrder } from "node:dns";
import { Resolver } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

setDefaultResultOrder("ipv4first");

const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);
const dnsCache = new Map();

const mode = process.argv[2] || "local";
const root = process.env.STHALI_SMOKE_ROOT
  || (mode === "remote"
    ? "https://api.sthali.com"
    : mode === "workers-dev"
      ? "https://sthali.sthali.workers.dev"
      : "http://127.0.0.1:8787");
const apiBase = `${root.replace(/\/$/, "")}/v1`;
const siteRoot = root.includes("api.sthali.com") ? "https://sthali.com" : root.replace(/\/$/, "");

const runId = Date.now().toString(36);
const checks = [];

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "OK" : "FAIL"}\t${name}${detail ? `\t${detail}` : ""}`);
}

async function request(path, init = {}) {
  const headers = { ...(init.headers ?? {}) };
  if (init.body && !hasHeader(headers, "Content-Type")) headers["Content-Type"] = "application/json";
  if (init.apiKey) headers.Authorization = `Bearer ${init.apiKey}`;
  const response = await rawRequest(`${apiBase}${path}`, { ...init, headers });
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  if (!response.ok) {
    const message = body.error || body.raw || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return body;
}

async function mcpRequest(message, init = {}) {
  const response = await rawRequest(`${siteRoot}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      ...(init.headers ?? {})
    },
    body: JSON.stringify(message)
  });
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  if (!response.ok) {
    const messageText = body.error?.message || body.raw || response.statusText;
    throw new Error(`${response.status} ${messageText}`);
  }
  return body;
}

async function expectForbidden(path, apiKey) {
  const response = await rawRequest(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  return response.status === 403 || response.status === 404;
}

function agentPayload(kind) {
  const capability = kind === "logistics" ? "quote_logistics_rate" : "source_textiles";
  return {
    display_name: `${kind === "logistics" ? "Logistics Quote" : "Textile Seller"} Agent ${runId}`,
    owner_name: `${kind === "logistics" ? "Demo Logistics" : "Demo Textiles"} ${runId}`,
    owner_domain: `${kind}-${runId}.example`,
    owner_country: "US",
    purpose: kind === "logistics"
      ? "Provides non-binding logistics quotes and serviceability checks for shipment requests."
      : "Finds suppliers and sends structured logistics quote requests for textile shipments.",
    description: "Synthetic smoke-test agent created by Sthali verification.",
    capabilities: [capability],
    supported_intents: [
      {
        intent: capability,
        requires_approval: false,
        max_response_time_seconds: 900
      }
    ],
    autonomy_level: "api_wrapper",
    data_policy: "Synthetic test data only.",
    contact_policy: "open"
  };
}

async function main() {
  const health = await request("/health");
  record("api health", health.ok === true);

  const docs = await request("/docs");
  record(
    "docs index",
    Boolean(
      docs.skill
      && docs.agents
      && docs.protocol
      && docs.mcp
      && docs.blog
      && docs.blog_feed
      && docs.models
      && docs.benchmarks
      && docs.benchmarks_suites
      && docs.benchmarks_lookup
    )
  );

  const rootResponse = await rawRequest(`${siteRoot}/`);
  const rootText = await rootResponse.text();
  record("root seo links", rootResponse.ok && rootText.includes("/blog") && rootText.includes("/mcp/server.json"));

  const skillResponse = await rawRequest(`${siteRoot}/skill.md`);
  const skillText = await skillResponse.text();
  record("agent skill markdown", skillResponse.ok && skillText.includes("POST /v1/agents/self-register") && skillText.includes("search_benchmarks") && skillText.includes("/v1/benchmarks/suites"));

  const blogIndexResponse = await rawRequest(`${siteRoot}/blog/`);
  const blogIndexText = await blogIndexResponse.text();
  record("blog html index", blogIndexResponse.ok && blogIndexText.includes("Sthali Agent Exchange Blog") && blogIndexText.includes("application/atom+xml"));

  const blogMarkdownResponse = await rawRequest(`${siteRoot}/blog/index.md`);
  const blogMarkdownText = await blogMarkdownResponse.text();
  record("blog markdown index", blogMarkdownResponse.ok && blogMarkdownText.includes("What Is An Agent Exchange?"));

  const blogFeedResponse = await rawRequest(`${siteRoot}/blog/feed.xml`);
  const blogFeedText = await blogFeedResponse.text();
  record("blog atom feed", blogFeedResponse.ok && blogFeedText.includes("<feed") && blogFeedText.includes("<entry>"));

  const blogPostResponse = await rawRequest(`${siteRoot}/blog/what-is-an-agent-exchange`);
  const blogPostText = await blogPostResponse.text();
  record("blog html post", blogPostResponse.ok && blogPostText.includes("What Is An Agent Exchange?") && blogPostText.includes("application/ld+json") && blogPostText.includes("og:title") && blogPostText.includes("text/markdown"));

  const blogPostMarkdownResponse = await rawRequest(`${siteRoot}/blog/what-is-an-agent-exchange.md`);
  const blogPostMarkdownText = await blogPostMarkdownResponse.text();
  record("blog markdown post", blogPostMarkdownResponse.ok && blogPostMarkdownText.includes("Agent Entry Points"));

  const sitemapResponse = await rawRequest(`${siteRoot}/sitemap.xml`);
  const sitemapText = await sitemapResponse.text();
  record("blog sitemap entries", sitemapResponse.ok && sitemapText.includes("/blog/feed.xml") && sitemapText.includes("/blog/what-is-an-agent-exchange") && sitemapText.includes("/blog/what-is-an-agent-exchange.md"));
  record(
    "models and benchmarks sitemap entries",
    sitemapResponse.ok
      && sitemapText.includes("/v1/models")
      && sitemapText.includes("/v1/benchmarks/suites")
  );

  const mcpServerResponse = await rawRequest(`${siteRoot}/mcp/server.json`);
  const mcpServer = JSON.parse(await mcpServerResponse.text());
  record("mcp server metadata", mcpServerResponse.ok && mcpServer.name === "com.sthali/agent-exchange");

  const mcpTools = await mcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  });
  const toolNames = mcpTools.result?.tools?.map((tool) => tool.name) ?? [];
  record(
    "mcp tools/list",
    toolNames.includes("self_register_agent")
      && toolNames.includes("quick_register_agent")
      && toolNames.includes("route_task")
      && toolNames.includes("search_agents")
      && toolNames.includes("search_models")
      && toolNames.includes("search_benchmarks")
      && toolNames.includes("list_benchmark_suites")
      && toolNames.includes("get_model_benchmarks")
      && toolNames.includes("suggest_capability")
      && toolNames.includes("vote_capability")
  );

  const mcpResources = await mcpRequest({
    jsonrpc: "2.0",
    id: 12,
    method: "resources/list"
  });
  const resourceUris = mcpResources.result?.resources?.map((resource) => resource.uri) ?? [];
  record("mcp resources/list", resourceUris.includes("sthali://blog/index") && resourceUris.some((uri) => uri.endsWith("/blog/feed.xml")));

  const routedTask = await request("/route-task", {
    method: "POST",
    body: JSON.stringify({
      task: "debug this CI log and identify the likely root cause",
      payload: {
        log: "npm ERR! ERESOLVE dependency conflict while resolving peer dependencies",
        smoke_run: runId
      }
    })
  });
  record(
    "route task recommends agent",
    Array.isArray(routedTask.recommendations)
      && routedTask.recommendations.some((item) => item.suggested_request?.to_address === "ci-log-triage-agent@sthali.com")
  );

  const quick = await request("/agents/quick-register", {
    method: "POST",
    body: JSON.stringify({
      display_name: `Quick Helper Agent ${runId}`,
      owner_name: `Quick Helper ${runId}`,
      owner_domain: `quick-${runId}.example`,
      purpose: `Reviews pull requests for security risks and missing tests. Synthetic smoke run ${runId}.`
    })
  });
  record("quick-register agent", Boolean(quick.agent?.agent_id && quick.api_key), quick.agent?.agent_address);

  const seller = await request("/agents/self-register", {
    method: "POST",
    body: JSON.stringify(agentPayload("seller"))
  });
  record("seller self-register", Boolean(seller.agent?.agent_id && seller.api_key), seller.agent?.agent_address);

  const logistics = await request("/agents/self-register", {
    method: "POST",
    body: JSON.stringify(agentPayload("logistics"))
  });
  record("logistics self-register", Boolean(logistics.agent?.agent_id && logistics.api_key), logistics.agent?.agent_address);

  const third = await request("/agents/self-register", {
    method: "POST",
    body: JSON.stringify({
      ...agentPayload("seller"),
      display_name: `Observer Agent ${runId}`,
      owner_name: `Observer ${runId}`
    })
  });
  record("third self-register", Boolean(third.agent?.agent_id && third.api_key), third.agent?.agent_address);

  const agents = await request(`/agents?q=${encodeURIComponent(runId)}`);
  record("public discovery", agents.agents.length >= 3, `${agents.agents.length} agents`);

  const managedAgents = await request("/agents?capability=get_exchange_rate");
  const currencyAgent = managedAgents.agents.find((agent) => agent.agent_address === "currency-rates-agent@sthali.com");
  record("managed currency agent discoverable", Boolean(currencyAgent?.agent_id), currencyAgent?.agent_address);

  const allAgents = await request("/agents?q=sthali.com");
  const managedAddresses = [
    "currency-rates-agent@sthali.com",
    "holiday-calendar-agent@sthali.com",
    "weather-risk-agent@sthali.com",
    "company-identity-agent@sthali.com",
    "domain-health-agent@sthali.com",
    "npm-package-agent@sthali.com",
    "github-repo-agent@sthali.com",
    "air-quality-agent@sthali.com",
    "pypi-package-agent@sthali.com",
    "osv-vulnerability-agent@sthali.com",
    "docker-image-agent@sthali.com",
    "github-issue-search-agent@sthali.com",
    "license-classifier-agent@sthali.com",
    "openapi-inspector-agent@sthali.com",
    "ci-log-triage-agent@sthali.com",
    "models-directory-agent@sthali.com",
    "benchmarks-agent@sthali.com"
  ];
  const discoveredAddresses = new Set((allAgents.agents ?? []).map((agent) => agent.agent_address));
  const missingManaged = managedAddresses.filter((address) => !discoveredAddresses.has(address));
  record(
    "all managed agents discoverable",
    missingManaged.length === 0,
    missingManaged.length ? `missing ${missingManaged.join(", ")}` : `${managedAddresses.length} agents`
  );

  const currencyRequest = await request("/exchange/requests", {
    method: "POST",
    apiKey: seller.api_key,
    body: JSON.stringify({
      to_address: "currency-rates-agent@sthali.com",
      intent: "get_exchange_rate",
      payload: {
        from: "USD",
        to: "EUR",
        amount: 100,
        smoke_run: runId
      }
    })
  });
  record(
    "managed currency agent auto responds",
    currencyRequest.request?.status === "answered"
      && currencyRequest.request?.response?.ok === true
      && typeof currencyRequest.request?.response?.rate === "number",
    currencyRequest.request?.response_hash
  );

  const managedSent = await request("/inbox?mailbox=sent", { apiKey: seller.api_key });
  const managedSentMatch = managedSent.requests.find((item) => item.request_id === currencyRequest.request.request_id);
  record(
    "managed response in sender inbox",
    managedSentMatch?.status === "answered" && managedSentMatch?.response?.ok === true
  );

  const extraManagedChecks = [
    {
      name: "holiday calendar",
      to_address: "holiday-calendar-agent@sthali.com",
      intent: "get_public_holidays",
      payload: { country_code: "US", year: 2026, smoke_run: runId },
      ok: (response) => response?.ok === true
        && response.country_code === "US"
        && Array.isArray(response.holidays)
        && response.holidays.length >= 1
    },
    {
      name: "weather risk",
      to_address: "weather-risk-agent@sthali.com",
      intent: "get_weather_forecast",
      payload: { city: "Berlin", country_code: "DE", smoke_run: runId },
      ok: (response) => response?.ok === true && Boolean(response.current || response.daily)
    },
    {
      name: "company identity",
      to_address: "company-identity-agent@sthali.com",
      intent: "lookup_legal_entity",
      payload: { lei: "5493001KJTIIGC8Y1R12", smoke_run: runId },
      ok: (response) => response?.ok === true && Array.isArray(response.entities) && response.entities.length >= 1
    },
    {
      name: "domain health",
      to_address: "domain-health-agent@sthali.com",
      intent: "check_domain_health",
      payload: { domain: "example.com", smoke_run: runId },
      ok: (response) => response?.ok === true && typeof response.checks?.has_spf === "boolean"
    },
    {
      name: "npm package",
      to_address: "npm-package-agent@sthali.com",
      intent: "lookup_npm_package",
      payload: { package: "react", smoke_run: runId },
      ok: (response) => response?.ok === true && typeof response.latest_version === "string"
    },
    {
      name: "github repo",
      to_address: "github-repo-agent@sthali.com",
      intent: "lookup_github_repo",
      payload: { repo: "facebook/react", smoke_run: runId },
      ok: (response) => response?.ok === true && typeof response.stars === "number"
    },
    {
      name: "air quality",
      to_address: "air-quality-agent@sthali.com",
      intent: "get_air_quality",
      payload: { city: "Delhi", country_code: "IN", smoke_run: runId },
      ok: (response) => response?.ok === true && Boolean(response.current)
    },
    {
      name: "pypi package",
      to_address: "pypi-package-agent@sthali.com",
      intent: "lookup_pypi_package",
      payload: { package: "requests", smoke_run: runId },
      ok: (response) => response?.ok === true && typeof response.latest_version === "string"
    },
    {
      name: "osv vulnerability",
      to_address: "osv-vulnerability-agent@sthali.com",
      intent: "check_package_vulnerabilities",
      payload: { ecosystem: "PyPI", package: "requests", smoke_run: runId },
      ok: (response) => response?.ok === true && typeof response.vulnerability_count === "number"
    },
    {
      name: "docker image",
      to_address: "docker-image-agent@sthali.com",
      intent: "lookup_docker_image",
      payload: { image: "nginx", smoke_run: runId },
      ok: (response) => response?.ok === true
        && (
          typeof response.pulls === "number"
          || (Array.isArray(response.recent_tags) && response.recent_tags.length > 0)
          || response.stats_available === false
        )
    },
    {
      name: "github issue search",
      to_address: "github-issue-search-agent@sthali.com",
      intent: "search_github_issues",
      payload: { repo: "microsoft/TypeScript", query: "bug", state: "open", smoke_run: runId },
      ok: (response) => response?.ok === true && Array.isArray(response.issues)
    },
    {
      name: "license classifier",
      to_address: "license-classifier-agent@sthali.com",
      intent: "classify_license",
      payload: { license: "MIT", smoke_run: runId },
      ok: (response) => response?.ok === true && response.risk === "low"
    },
    {
      name: "openapi inspector",
      to_address: "openapi-inspector-agent@sthali.com",
      intent: "inspect_openapi",
      payload: { url: "https://sthali.com/openapi.json", smoke_run: runId },
      ok: (response) => response?.ok === true && typeof response.operation_count === "number"
    },
    {
      name: "ci log triage",
      to_address: "ci-log-triage-agent@sthali.com",
      intent: "triage_ci_log",
      payload: { log: "npm ERR! ERESOLVE dependency conflict while resolving peer dependencies", smoke_run: runId },
      ok: (response) => response?.ok === true && response.primary_category === "dependency_resolution"
    },
    {
      name: "models directory search",
      to_address: "models-directory-agent@sthali.com",
      intent: "search_models",
      payload: { q: "claude", tool_call: true, limit: 5, smoke_run: runId },
      ok: (response) => response?.ok === true
        && Array.isArray(response.models)
        && typeof response.total === "number"
    },
    {
      name: "models directory get",
      to_address: "models-directory-agent@sthali.com",
      intent: "get_model",
      payload: { model_id: "anthropic/claude-opus-4-6", smoke_run: runId },
      ok: (response) => response?.ok === true
        && response.model?.id === "anthropic/claude-opus-4-6"
        && Array.isArray(response.providers)
    },
    {
      name: "benchmarks suites",
      to_address: "benchmarks-agent@sthali.com",
      intent: "list_benchmark_suites",
      payload: { smoke_run: runId },
      ok: (response) => response?.ok === true
        && Array.isArray(response.suites)
        && response.suites.some((suite) => suite.id === "swe-bench-verified")
    },
    {
      name: "benchmarks leaderboard",
      to_address: "benchmarks-agent@sthali.com",
      intent: "list_benchmark_leaderboard",
      payload: { suite: "swe-bench-verified", page_size: 5, smoke_run: runId },
      ok: (response) => response?.ok === true
        && response.suite === "swe-bench-verified"
        && Array.isArray(response.models)
    },
    {
      name: "benchmarks model lookup",
      to_address: "benchmarks-agent@sthali.com",
      intent: "get_model_benchmarks",
      payload: { model_id: "anthropic/claude-opus-4-6", smoke_run: runId },
      ok: (response) => response?.ok === true
        && response.model_id === "anthropic/claude-opus-4-6"
        && Array.isArray(response.benchmarks)
    },
    {
      name: "benchmarks submit",
      to_address: "benchmarks-agent@sthali.com",
      intent: "submit_benchmark",
      payload: {
        model_id: "anthropic/claude-opus-4-6",
        suite: "swe-bench-verified",
        value: 0.4242,
        unit: "resolved_rate",
        higher_is_better: true,
        benchmark_provider_id: `smoke-${runId}`,
        benchmark_provider_name: `Smoke ${runId}`,
        as_of: new Date().toISOString().slice(0, 10),
        smoke_run: runId
      },
      ok: (response) => response?.ok === true
        && response.accepted === true
        && response.score?.model_id === "anthropic/claude-opus-4-6"
    }
  ];

  for (const check of extraManagedChecks) {
    const managedRequest = await request("/exchange/requests", {
      method: "POST",
      apiKey: seller.api_key,
      body: JSON.stringify({
        to_address: check.to_address,
        intent: check.intent,
        payload: check.payload
      })
    });
    record(
      `managed ${check.name} agent auto responds`,
      managedRequest.request?.status === "answered" && check.ok(managedRequest.request?.response),
      managedRequest.request?.response_hash
    );
  }

  const capability = await request("/capability-requests", {
    method: "POST",
    apiKey: seller.api_key,
    body: JSON.stringify({
      title: `Webhook delivery ${runId}`,
      problem: "Agents need push delivery when a hosted inbox receives a time-sensitive request.",
      proposed_capability: "Send signed webhooks for new hosted inbox messages so agents can react without polling.",
      example_use_case: `Synthetic smoke-test roadmap request ${runId}.`,
      category: "messaging"
    })
  });
  record(
    "capability request create",
    capability.capability_request?.title?.includes(runId),
    capability.capability_request?.request_id
  );

  const capabilityList = await request(`/capability-requests?q=${encodeURIComponent(runId)}`);
  record(
    "capability request public list",
    capabilityList.capability_requests?.some((item) => item.request_id === capability.capability_request.request_id)
  );

  const upvoted = await request(`/capability-requests/${capability.capability_request.request_id}/vote`, {
    method: "POST",
    apiKey: logistics.api_key,
    body: JSON.stringify({ vote: "up" })
  });
  record("capability upvote", upvoted.capability_request?.votes?.up === 1 && upvoted.capability_request?.votes?.score === 1);

  const downvoted = await request(`/capability-requests/${capability.capability_request.request_id}/vote`, {
    method: "POST",
    apiKey: third.api_key,
    body: JSON.stringify({ vote: "down" })
  });
  record("capability downvote", downvoted.capability_request?.votes?.down === 1 && downvoted.capability_request?.votes?.score === 0);

  const mcpSearch = await mcpRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "search_agents",
      arguments: {
        q: runId
      }
    }
  });
  const mcpSearchText = mcpSearch.result?.content?.[0]?.text ?? "";
  record("mcp search_agents", mcpSearchText.includes(runId));

  const mcpCapabilityList = await mcpRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "list_capability_requests",
      arguments: {
        q: runId
      }
    }
  });
  const mcpCapabilityText = mcpCapabilityList.result?.content?.[0]?.text ?? "";
  record("mcp list_capability_requests", mcpCapabilityText.includes(runId));

  const modelsList = await request("/models?q=claude&page_size=5&tool_call=true");
  record(
    "models directory list",
    Array.isArray(modelsList.models)
      && modelsList.models.length >= 1
      && modelsList.attribution_url === "https://models.dev"
      && typeof modelsList.total === "number",
    `${modelsList.total ?? 0} models`
  );

  const modelLookup = await request(`/models/lookup?id=${encodeURIComponent("anthropic/claude-opus-4-6")}`);
  record(
    "models directory lookup",
    modelLookup.model?.id === "anthropic/claude-opus-4-6"
      && Array.isArray(modelLookup.providers)
      && Array.isArray(modelLookup.benchmarks),
    modelLookup.model?.name
  );

  const benchmarkSuites = await request("/benchmarks/suites");
  record(
    "benchmark suites",
    Array.isArray(benchmarkSuites.suites)
      && benchmarkSuites.suites.some((suite) => suite.id === "swe-bench-verified"),
    `${benchmarkSuites.suites?.length ?? 0} suites`
  );

  const benchmarkBoard = await request("/benchmarks?suite=swe-bench-verified&page_size=10");
  record(
    "benchmark leaderboard",
    benchmarkBoard.suite === "swe-bench-verified"
      && Array.isArray(benchmarkBoard.models)
      && typeof benchmarkBoard.total === "number",
    `${benchmarkBoard.total ?? 0} scored models`
  );

  const benchmarkLookup = await request(`/benchmarks/lookup?model_id=${encodeURIComponent("anthropic/claude-opus-4-6")}`);
  record(
    "benchmark model lookup",
    benchmarkLookup.model_id === "anthropic/claude-opus-4-6"
      && Array.isArray(benchmarkLookup.benchmarks)
      && benchmarkLookup.benchmarks.length >= 1,
    `${benchmarkLookup.benchmarks?.length ?? 0} scores`
  );

  const mcpModels = await mcpRequest({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "search_models",
      arguments: {
        q: "claude",
        page_size: 5
      }
    }
  });
  const mcpModelsText = mcpModels.result?.content?.[0]?.text ?? "";
  record("mcp search_models", mcpModelsText.includes("claude") || mcpModelsText.includes("models"));

  const mcpBenchmarks = await mcpRequest({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "search_benchmarks",
      arguments: {
        suite: "swe-bench-verified",
        page_size: 5
      }
    }
  });
  const mcpBenchmarksText = mcpBenchmarks.result?.content?.[0]?.text ?? "";
  record(
    "mcp search_benchmarks",
    mcpBenchmarksText.includes("swe-bench-verified") || mcpBenchmarksText.includes("models")
  );

  const providerFiltered = await request("/benchmarks?suite=swe-bench-verified&benchmark_provider=openai&page_size=50");
  record(
    "benchmark provider filter keeps seed scores",
    Array.isArray(providerFiltered.models)
      && providerFiltered.models.some((row) => row.model_id === "openai/gpt-5" && row.benchmark_provider_id === "openai"),
    `${providerFiltered.total ?? 0} openai-filtered models`
  );

  const zeroSubmit = await request("/exchange/requests", {
    method: "POST",
    apiKey: seller.api_key,
    body: JSON.stringify({
      to_address: "benchmarks-agent@sthali.com",
      intent: "submit_benchmark",
      payload: {
        model_id: "anthropic/claude-opus-4-6",
        suite: "hle",
        value: 0,
        benchmark_provider_id: `smoke-zero-${runId}`,
        benchmark_provider_name: `Smoke Zero ${runId}`,
        as_of: new Date().toISOString().slice(0, 10),
        smoke_run: runId
      }
    })
  });
  record(
    "benchmark zero score accepted",
    zeroSubmit.request?.status === "answered"
      && zeroSubmit.request?.response?.ok === true
      && zeroSubmit.request?.response?.accepted === true
      && zeroSubmit.request?.response?.score?.value === 0
  );

  const card = await request(`/agents/${logistics.agent.agent_id}/card`);
  record("agent card", card.schema_version === "sthali.agent_card.v0" && card.agent_address === logistics.agent.agent_address);

  const created = await request("/exchange/requests", {
    method: "POST",
    apiKey: seller.api_key,
    body: JSON.stringify({
      to_address: logistics.agent.agent_address,
      intent: "quote_logistics_rate",
      payload: {
        pickup_city: "Surat",
        drop_city: "Guwahati",
        weight_kg: 120,
        product_type: "textiles",
        smoke_run: runId
      }
    })
  });
  record("private request create", created.request?.status === "queued", created.request?.request_id);

  const received = await request("/inbox?mailbox=received", { apiKey: logistics.api_key });
  const receivedMatch = received.requests.some((item) => item.request_id === created.request.request_id);
  record("recipient inbox receives request", receivedMatch);

  const privacyBlocked = await expectForbidden(`/exchange/requests/${created.request.request_id}`, third.api_key);
  record("third-party privacy blocked", privacyBlocked);

  const answered = await request(`/exchange/requests/${created.request.request_id}/respond`, {
    method: "POST",
    apiKey: logistics.api_key,
    body: JSON.stringify({
      payload: {
        serviceable: true,
        estimated_price: "non-binding estimate",
        eta_days: 5,
        smoke_run: runId
      }
    })
  });
  record("recipient responds", answered.request?.status === "answered");

  const sent = await request("/inbox?mailbox=sent", { apiKey: seller.api_key });
  const sentMatch = sent.requests.find((item) => item.request_id === created.request.request_id);
  record("sender sees response", sentMatch?.status === "answered" && sentMatch?.response?.serviceable === true);

  if (checks.some((check) => !check.ok)) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(`FAIL\tsmoke\t${error.message}`);
  process.exit(2);
});

function hasHeader(headers, name) {
  const normalized = name.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === normalized);
}

function rawRequest(urlText, init = {}) {
  const url = new URL(urlText);
  const transport = url.protocol === "http:" ? httpRequest : httpsRequest;
  const body = init.body ? Buffer.from(init.body) : null;
  const headers = { ...(init.headers ?? {}) };
  if (body && !hasHeader(headers, "Content-Length")) headers["Content-Length"] = String(body.byteLength);

  return new Promise((resolve, reject) => {
    const req = transport({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: init.method ?? "GET",
      headers,
      lookup: publicDnsLookup
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: async () => buffer.toString("utf8")
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error(`Request timed out: ${urlText}`));
    });
    if (body) req.write(body);
    req.end();
  });
}

function publicDnsLookup(hostname, options, callback) {
  if (isIP(hostname)) {
    callback(null, hostname, isIP(hostname));
    return;
  }
  if (hostname === "localhost") {
    systemLookup(hostname, options, callback);
    return;
  }
  resolvePublic(hostname).then((addresses) => {
    if (options?.all) {
      callback(null, addresses);
      return;
    }
    const first = addresses[0];
    callback(null, first.address, first.family);
  }).catch(() => {
    systemLookup(hostname, options, callback);
  });
}

async function resolvePublic(hostname) {
  const cached = dnsCache.get(hostname);
  if (cached) return cached;
  const addresses = [];
  try {
    const records = await resolver.resolve4(hostname);
    addresses.push(...records.map((address) => ({ address, family: 4 })));
  } catch {}
  try {
    const records = await resolver.resolve6(hostname);
    addresses.push(...records.map((address) => ({ address, family: 6 })));
  } catch {}
  if (!addresses.length) throw new Error(`Public DNS could not resolve ${hostname}`);
  dnsCache.set(hostname, addresses);
  return addresses;
}
