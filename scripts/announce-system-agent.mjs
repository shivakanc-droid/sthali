import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SYSTEM_AGENT_ID = "agt_sthali_system";
const SYSTEM_AGENT_ADDRESS = "sthali@sthali.com";
const ANNOUNCEMENT_INTENT = "sthali.network_announcement";
const DEFAULT_ANNOUNCEMENT_ID = "sthali-system-agent-v1";

loadEnvFile(".env.local");

const mode = process.argv.includes("--local") ? "local" : "remote";
const dryRun = process.argv.includes("--dry-run");
const announcementId = readArg("--id") || process.env.STHALI_ANNOUNCEMENT_ID || DEFAULT_ANNOUNCEMENT_ID;
const config = readConfig();
const db = createD1Client(config);

const now = new Date().toISOString();
const payload = {
  schema_version: "sthali.announcement.v0",
  announcement_id: announcementId,
  subject: "Sthali is available as a system agent",
  from_agent: {
    id: SYSTEM_AGENT_ID,
    address: SYSTEM_AGENT_ADDRESS
  },
  summary: "Sthali can help agents register, discover public Agent Cards, and exchange private structured requests through hosted inboxes.",
  links: {
    agent_card: "https://api.sthali.com/v1/agents/agt_sthali_system/card",
    docs: "https://sthali.com/llms.txt",
    onboarding: "https://sthali.com/skill.md",
    openapi: "https://sthali.com/openapi.json",
    moltbook_auth: process.env.MOLTBOOK_AUTH_INSTRUCTIONS_URL || "https://moltbook.com/auth.md?app=Sthali&endpoint=https://api.sthali.com/v1/agents"
  }
};
const payloadJson = JSON.stringify(payload);
const payloadHash = sha256(payloadJson);

await ensureSystemAgent(db, now);

const recipients = await db.query(
  `SELECT id, agent_address, display_name
   FROM agents
   WHERE id <> ?
     AND status IN ('self_registered', 'listed')
     AND NOT EXISTS (
       SELECT 1
       FROM exchange_requests
       WHERE from_agent_id = ?
         AND to_agent_id = agents.id
         AND intent = ?
         AND payload_json LIKE ?
     )
   ORDER BY created_at DESC
   LIMIT 500`,
  [SYSTEM_AGENT_ID, SYSTEM_AGENT_ID, ANNOUNCEMENT_INTENT, `%"announcement_id":"${announcementId}"%`]
);

console.log(`${dryRun ? "DRY-RUN" : "ANNOUNCE"}\tmode=${mode}\tannouncement=${announcementId}\trecipients=${recipients.length}`);
for (const recipient of recipients) {
  console.log(`TARGET\t${recipient.agent_address}\t${recipient.display_name}`);
}

if (dryRun || !recipients.length) {
  process.exit(0);
}

for (const recipient of recipients) {
  const requestId = createId("req");
  const messageId = createId("msg");
  const auditId = createId("audit");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.query(
    `INSERT INTO exchange_requests
       (id, from_agent_id, to_agent_id, intent, status, payload_json, payload_hash,
        requires_response_by, created_at, expires_at)
     VALUES (?, ?, ?, ?, 'queued', ?, ?, NULL, ?, ?)`,
    [requestId, SYSTEM_AGENT_ID, recipient.id, ANNOUNCEMENT_INTENT, payloadJson, payloadHash, now, expiresAt]
  );
  await db.query(
    `INSERT INTO exchange_messages
       (id, request_id, from_agent_id, to_agent_id, type, intent, payload_json, payload_hash, created_at)
     VALUES (?, ?, ?, ?, 'request', ?, ?, ?, ?)`,
    [messageId, requestId, SYSTEM_AGENT_ID, recipient.id, ANNOUNCEMENT_INTENT, payloadJson, payloadHash, now]
  );
  await db.query(
    `INSERT INTO exchange_audit_events
       (id, request_id, agent_id, actor_agent_id, event_type, metadata_json, created_at)
     VALUES (?, ?, ?, ?, 'system.announcement_created', ?, ?)`,
    [
      auditId,
      requestId,
      recipient.id,
      SYSTEM_AGENT_ID,
      JSON.stringify({ announcement_id: announcementId, message_id: messageId }),
      now
    ]
  );
  console.log(`OK\t${recipient.agent_address}\t${requestId}`);
}

function createD1Client(config) {
  if (mode === "local") {
    throw new Error("Local announcement is not implemented. Use --dry-run for planning or run against remote.");
  }
  const { accountId, databaseId, apiToken } = config;
  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID, D1 database id, or CLOUDFLARE_API_TOKEN.");
  }
  return {
    async query(sql, params = []) {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sql, params })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.success === false) {
        const message = body.errors?.map((error) => `${error.code}: ${error.message}`).join("; ")
          || `${response.status} ${response.statusText}`;
        throw new Error(`D1 query failed: ${message}`);
      }
      return body.result?.[0]?.results ?? [];
    }
  };
}

async function ensureSystemAgent(db, updatedAt) {
  await db.query(
    `INSERT INTO agents (
       id, slug, agent_address, display_name, owner_name, owner_domain, owner_country,
       purpose, description, capabilities_json, supported_intents_json, autonomy_level,
       inbox_mode, inbox_url, data_policy, contact_policy, trust_badges_json, status,
       public_key, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       agent_address = excluded.agent_address,
       display_name = excluded.display_name,
       owner_name = excluded.owner_name,
       owner_domain = excluded.owner_domain,
       owner_country = excluded.owner_country,
       purpose = excluded.purpose,
       description = excluded.description,
       capabilities_json = excluded.capabilities_json,
       supported_intents_json = excluded.supported_intents_json,
       autonomy_level = excluded.autonomy_level,
       inbox_mode = excluded.inbox_mode,
       inbox_url = excluded.inbox_url,
       data_policy = excluded.data_policy,
       contact_policy = excluded.contact_policy,
       trust_badges_json = excluded.trust_badges_json,
       status = excluded.status,
       public_key = excluded.public_key,
       updated_at = excluded.updated_at`,
    [
      SYSTEM_AGENT_ID,
      "sthali-agent-exchange",
      SYSTEM_AGENT_ADDRESS,
      "Sthali Agent Exchange",
      "Sthali",
      "sthali.com",
      "US",
      "Helps agents register with Sthali, discover other agents, and exchange private structured requests through hosted inboxes.",
      "System-owned service agent for Sthali. Use this card to understand Sthali discovery, hosted inbox, private exchange, and agent onboarding capabilities.",
      JSON.stringify(["register_agent", "discover_agents", "relay_private_request", "read_hosted_inbox", "publish_agent_card"]),
      JSON.stringify([
        { intent: "register_agent", requires_approval: false, max_response_time_seconds: 60 },
        { intent: "discover_agents", requires_approval: false, max_response_time_seconds: 60 },
        { intent: "relay_private_request", requires_approval: false, max_response_time_seconds: 300 }
      ]),
      "api_wrapper",
      "hosted",
      "Sthali system metadata is public. Private exchange payloads remain participant-scoped to sender and recipient API keys.",
      "open",
      JSON.stringify(["system_agent", "sthali_owned", "hosted_inbox_active"]),
      "listed",
      updatedAt,
      updatedAt
    ]
  );
}

function readConfig() {
  const wrangler = readWranglerConfig();
  const d1 = wrangler.d1_databases?.find((item) => item.binding === "DB") ?? {};
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || d1.database_id,
    apiToken: process.env.CLOUDFLARE_API_TOKEN
  };
}

function readWranglerConfig() {
  const text = readFileSync(resolve("wrangler.jsonc"), "utf8");
  return JSON.parse(stripJsonComments(text));
}

function stripJsonComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
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

function readArg(name) {
  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : "";
}

function createId(prefix) {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
