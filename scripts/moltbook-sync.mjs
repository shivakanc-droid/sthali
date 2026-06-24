import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");

const dryRun = process.argv.includes("--dry-run");
const agentCardUrl = process.env.STHALI_AGENT_CARD_URL || "https://sthali.com/.well-known/agent.json";
const registerUrl = process.env.MOLTBOOK_AGENT_REGISTER_URL;
const authInstructionsUrl = process.env.MOLTBOOK_AUTH_INSTRUCTIONS_URL
  || "https://moltbook.com/auth.md?app=Sthali&endpoint=https://api.sthali.com/v1/agents";

const cardResponse = await fetch(agentCardUrl, {
  headers: { Accept: "application/json" }
});
if (!cardResponse.ok) {
  throw new Error(`Could not fetch Sthali service card: ${cardResponse.status} ${cardResponse.statusText}`);
}
const card = await cardResponse.json();
const payload = {
  name: "Sthali Agent Exchange",
  description: card.description,
  url: card.url,
  agent_card_url: card.agent_card_url,
  documentation_url: card.documentation_url,
  openapi_url: card.openapi_url,
  api_base_url: card.api_base_url,
  auth_instructions_url: authInstructionsUrl,
  agent: card.agent,
  capabilities: card.capabilities,
  skills: card.skills,
  tags: ["agent-exchange", "agent-directory", "hosted-inbox", "private-agent-requests"]
};

if (dryRun || !registerUrl) {
  console.log(`${dryRun ? "DRY-RUN" : "SKIP"}\tMoltbook sync`);
  if (!registerUrl) {
    console.log("MOLTBOOK_AGENT_REGISTER_URL is not set. No external write was attempted.");
  }
  console.log(JSON.stringify(payload, null, 2));
} else {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "Idempotency-Key": "sthali-agent-exchange"
  });
  if (process.env.MOLTBOOK_AGENT_API_KEY) {
    headers.set("Authorization", `Bearer ${process.env.MOLTBOOK_AGENT_API_KEY}`);
  }
  if (process.env.MOLTBOOK_APP_KEY) {
    headers.set("X-Moltbook-App-Key", process.env.MOLTBOOK_APP_KEY);
  }

  const response = await fetch(registerUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {}
  if (!response.ok) {
    console.error(JSON.stringify(body, null, 2));
    throw new Error(`Moltbook sync failed: ${response.status} ${response.statusText}`);
  }

  console.log(`OK\tMoltbook sync\t${response.status}`);
  console.log(JSON.stringify(body, null, 2));
}

function loadEnvFile(path) {
  const fullPath = resolve(path);
  if (!existsSync(fullPath)) return;
  for (const rawLine of readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const name = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[name]) process.env[name] = value;
  }
}
