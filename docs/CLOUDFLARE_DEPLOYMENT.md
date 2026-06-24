# Cloudflare Deployment

Sthali V0 runs on Cloudflare.

## Resources

```text
Worker name: sthali
D1 database: sthali_registry
R2 bucket: sthali-artifacts
Queue: sthali-delivery
Primary domain: sthali.com
API domain: api.sthali.com
Docs domain: docs.sthali.com
```

The Worker serves:

- the React app from static assets
- `/v1/*` API routes
- `/skill.md`
- `/docs/agents.md`
- `/docs/protocol.md`

## Required Token Permissions

For bootstrap and deploy, use a Cloudflare API token scoped to the account and the `sthali.com` zone.

Account permissions:

```text
Account Settings Read
D1 Read
D1 Write
Queues Read
Queues Write
Workers R2 Storage Read
Workers R2 Storage Write
Workers Scripts Read
Workers Scripts Write
Workers Tail Read
```

Zone permissions for `sthali.com`:

```text
Zone Read
DNS Read
DNS Write
Zone Settings Read
Zone Settings Write
Zone DNS Settings Read
Zone DNS Settings Write
Email Routing Rules Read
Email Routing Rules Write
Email Routing Addresses Read
Email Routing Addresses Write
```

Custom domains are attached with Cloudflare's account-level Workers Domains API:

```text
PUT /accounts/{account_id}/workers/domains
```

The deployment does not rely on zone-level Workers Routes permissions.

## Local Env

Copy:

```bash
cp .env.example .env.local
cp .dev.vars.example .dev.vars
```

Load `.env.local` in PowerShell:

```powershell
. .\scripts\cloudflare-env.ps1
```

Never commit `.env.local` or `.dev.vars`.

## Provisioned State

The current `wrangler.jsonc` is configured for:

```text
D1 database id: 2ddfdbc4-a0e5-4a76-81c1-37f5f2ab6566
R2 bucket: sthali-artifacts
Queue: sthali-delivery
```

## Commands

Local:

```bash
npm install
npm run db:migrate:local
npm run worker:dev
npm run smoke:local
```

Remote:

```bash
npm run db:migrate:remote
npm run deploy
npm run smoke:remote
```

Worker-only deploy:

```bash
npm run deploy:worker
```

Workers.dev URL:

```text
https://sthali.sthali.workers.dev
```

Custom domain binding:

```bash
npm run domains:bind
```

Bound hostnames:

```text
sthali.com
api.sthali.com
docs.sthali.com
```
