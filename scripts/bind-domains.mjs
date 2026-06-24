import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");

const required = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_API_TOKEN"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(2);
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const service = process.env.CLOUDFLARE_WORKER_NAME || "sthali";
const environment = process.env.CLOUDFLARE_WORKER_ENVIRONMENT || "production";
const apexHost = process.env.STHALI_DOMAIN || "sthali.com";
const hostnames = Array.from(new Set([
  apexHost,
  process.env.STHALI_WWW_HOST || `www.${apexHost}`,
  process.env.STHALI_API_HOST || "api.sthali.com",
  process.env.STHALI_DOCS_HOST || "docs.sthali.com"
]));

const headers = {
  Authorization: `Bearer ${apiToken}`,
  "Content-Type": "application/json"
};

for (const hostname of hostnames) {
  const result = await bindDomain(hostname);
  console.log(`OK\tbound ${result.hostname}\t${result.service}/${result.environment}`);
}

async function bindDomain(hostname, retry = true) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/domains`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      environment,
      hostname,
      service,
      zone_id: zoneId
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const message = body.errors?.map((error) => `${error.code}: ${error.message}`).join("; ")
      || `${response.status} ${response.statusText}`;
    if (retry && hasErrorCode(body, 100117) && hostname === `www.${apexHost}`) {
      await deleteConflictingDnsRecords(hostname);
      return bindDomain(hostname, false);
    }
    throw new Error(`Failed to bind ${hostname}: ${message}`);
  }
  return body.result;
}

async function deleteConflictingDnsRecords(hostname) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(hostname)}&per_page=100`,
    { headers }
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const message = body.errors?.map((error) => `${error.code}: ${error.message}`).join("; ")
      || `${response.status} ${response.statusText}`;
    throw new Error(`Failed to inspect DNS records for ${hostname}: ${message}`);
  }

  const records = (body.result ?? []).filter((record) => ["A", "AAAA", "CNAME"].includes(record.type));
  for (const record of records) {
    const deleteResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`,
      { method: "DELETE", headers }
    );
    const deleteBody = await deleteResponse.json().catch(() => ({}));
    if (!deleteResponse.ok || deleteBody.success === false) {
      const message = deleteBody.errors?.map((error) => `${error.code}: ${error.message}`).join("; ")
        || `${deleteResponse.status} ${deleteResponse.statusText}`;
      throw new Error(`Failed to delete conflicting DNS record ${record.name}: ${message}`);
    }
    console.log(`OK\tdeleted conflicting ${record.type} ${record.name}`);
  }
}

function hasErrorCode(body, code) {
  return Boolean(body.errors?.some((error) => Number(error.code) === code));
}

function loadEnvFile(path) {
  const fullPath = resolve(path);
  if (!existsSync(fullPath)) return;
  const text = readFileSync(fullPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
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
