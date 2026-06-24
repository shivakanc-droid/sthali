const root = (process.argv[2] || "http://127.0.0.1:8787").replace(/\/$/, "");
const pagesToScan = [
  "/",
  "/blog/list?source=app",
  "/blog/",
  "/blog/what-is-an-agent-exchange",
  "/docs/index.md",
  "/llms.txt"
];
const appKnownLinks = [
  "/blog/list?source=app",
  "/blog/",
  "/skill.md",
  "/llms.txt",
  "/docs/index.md",
  "/docs/agents.md",
  "/docs/protocol.md",
  "/docs/feedback.md",
  "/blog/index.md",
  "/blog/feed.xml",
  "/openapi.json",
  "/.well-known/agent.json",
  "/mcp/server.json",
  "/v1/docs"
];

const discovered = new Map();

for (const path of pagesToScan) {
  const url = absoluteUrl(path);
  const response = await fetch(url, { redirect: "manual" });
  const text = await response.text();
  console.log(`${okStatus(response.status) ? "OK" : "FAIL"}\t${response.status}\tSCAN_PAGE\t${url}`);
  if (!okStatus(response.status)) process.exitCode = 2;

  for (const link of extractLinks(text, url)) {
    discovered.set(link.href, link);
  }
}

for (const href of appKnownLinks.map(absoluteUrl)) {
  discovered.set(href, { href, text: "app-known-link" });
}

let failures = 0;
for (const link of discovered.values()) {
  const response = await fetch(link.href, { redirect: "manual" });
  const status = response.status;
  const ok = okStatus(status);
  console.log(`${ok ? "OK" : "FAIL"}\t${status}\t${link.text || "(no text)"}\t${link.href}`);
  if (!ok) failures += 1;
}

if (failures) process.exitCode = 2;

function absoluteUrl(pathOrUrl) {
  return new URL(pathOrUrl, `${root}/`).toString();
}

function okStatus(status) {
  return status >= 200 && status < 400;
}

function extractLinks(text, baseUrl) {
  const links = [];
  const anchorPattern = /<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(text)) !== null) {
    const href = match[2]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    const textContent = stripHtml(match[3]).trim().replace(/\s+/g, " ");
    links.push({
      href: new URL(href, baseUrl).toString(),
      text: textContent
    });
  }
  return links;
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
