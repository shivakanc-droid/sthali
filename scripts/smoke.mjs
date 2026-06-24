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
  record("docs index", Boolean(docs.skill && docs.agents && docs.protocol && docs.mcp && docs.blog && docs.blog_feed));

  const rootResponse = await rawRequest(`${siteRoot}/`);
  const rootText = await rootResponse.text();
  record("root seo links", rootResponse.ok && rootText.includes("/blog") && rootText.includes("/mcp/server.json"));

  const skillResponse = await rawRequest(`${siteRoot}/skill.md`);
  const skillText = await skillResponse.text();
  record("agent skill markdown", skillResponse.ok && skillText.includes("POST /v1/agents/self-register"));

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
      && toolNames.includes("search_agents")
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
