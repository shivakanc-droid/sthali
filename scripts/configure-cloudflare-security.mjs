import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");

const required = ["CLOUDFLARE_ZONE_ID", "CLOUDFLARE_API_TOKEN"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(2);
}

const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const headers = {
  Authorization: `Bearer ${apiToken}`,
  "Content-Type": "application/json"
};

await patchZoneSetting("always_use_https", "on");
await patchZoneSetting("min_tls_version", "1.2");
await patchZoneSetting("security_header", {
  strict_transport_security: {
    enabled: true,
    max_age: 15552000,
    include_subdomains: true,
    preload: false,
    nosniff: true
  }
});

await reportProblemDnsRecords();

async function patchZoneSetting(setting, value) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/${setting}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ value })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const message = body.errors?.map((error) => `${error.code}: ${error.message}`).join("; ")
      || `${response.status} ${response.statusText}`;
    throw new Error(`Failed to update ${setting}: ${message}`);
  }
  console.log(`OK\t${setting}\t${JSON.stringify(body.result?.value ?? value)}`);
}

async function reportProblemDnsRecords() {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100`, {
    headers
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) return;

  const domainConnect = body.result?.find((record) => record.name === "_domainconnect.sthali.com");
  if (domainConnect) {
    console.log(
      `WARN\t_domainconnect.sthali.com exists as ${domainConnect.type} -> ${domainConnect.content}; remove it if GoDaddy DomainConnect is not needed.`
    );
  }
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
