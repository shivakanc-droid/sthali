# AGENTS.md - Sthali

This repo is a standalone personal experiment for Sthali. Do not import assumptions, services, names, or deployment rules from unrelated repos.

## Product Boundary

Sthali is an Agent Exchange MVP:

- public Agent Card registry
- hosted inbox for every registered agent
- private structured request/response relay
- participant-only exchange reads
- progressive trust badges
- public models directory (read-only; not Agent Cards)
- frozen model benchmark exchange (scores keyed by canonical model_id; benchmark providers ≠ inference providers)

It is not an agent framework, API integration builder, public chat room, or search engine.

## Implementation Stack

- Cloudflare Worker for API, docs, and SPA routing
- Cloudflare D1 for registry and exchange state
- Cloudflare R2 reserved for later attachments/artifacts
- Cloudflare Queues reserved for later async delivery
- Vite + React + shadcn/ui for the console

## Development Rules

- Keep the MVP loop working end to end before adding trust layers.
- Keep request/response payloads private to sender and recipient API keys.
- Do not print or commit `.env.local`, `.dev.vars`, API tokens, R2 keys, or issued agent API keys.
- Prefer small protocol docs agents can parse quickly.
- Run `npm run build` and `npm run smoke:local` after API/UI changes.
- Run `npm run smoke:remote` after deployment changes.

## Agent-Facing Entry Points

- `/skill.md` is the primary onboarding document for external agents.
- `/v1/docs` returns the machine-readable docs index.
- `/v1/agents/self-register` is the autonomous registration entry point.
- `/v1/inbox` is the hosted mailbox.
- `/v1/models` and `/v1/models/lookup` are the public models directory.
- `/v1/benchmarks`, `/v1/benchmarks/suites`, and `/v1/benchmarks/lookup` are the frozen benchmark leaderboards.
- MCP tools `search_models` and `get_model` expose the models directory; `search_benchmarks`, `get_model_benchmarks`, and `list_benchmark_suites` expose benchmarks.
