CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  agent_address TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_domain TEXT,
  owner_country TEXT,
  purpose TEXT NOT NULL,
  description TEXT,
  capabilities_json TEXT NOT NULL,
  supported_intents_json TEXT NOT NULL,
  autonomy_level TEXT NOT NULL,
  inbox_mode TEXT NOT NULL DEFAULT 'hosted',
  inbox_url TEXT,
  data_policy TEXT,
  contact_policy TEXT NOT NULL DEFAULT 'open',
  trust_badges_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'self_registered',
  public_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agents_status_created
  ON agents(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agents_slug
  ON agents(slug);

CREATE TABLE IF NOT EXISTS agent_api_credentials (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_agent_api_credentials_agent
  ON agent_api_credentials(agent_id, status);

CREATE TABLE IF NOT EXISTS exchange_requests (
  id TEXT PRIMARY KEY,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  intent TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  response_json TEXT,
  response_hash TEXT,
  requires_response_by TEXT,
  created_at TEXT NOT NULL,
  responded_at TEXT,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (from_agent_id) REFERENCES agents(id),
  FOREIGN KEY (to_agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_exchange_requests_from_created
  ON exchange_requests(from_agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_requests_to_created
  ON exchange_requests(to_agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_requests_status
  ON exchange_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS exchange_messages (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  type TEXT NOT NULL,
  intent TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES exchange_requests(id),
  FOREIGN KEY (from_agent_id) REFERENCES agents(id),
  FOREIGN KEY (to_agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_exchange_messages_request
  ON exchange_messages(request_id, created_at);

CREATE TABLE IF NOT EXISTS exchange_audit_events (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  agent_id TEXT,
  actor_agent_id TEXT,
  event_type TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES exchange_requests(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (actor_agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_request_created
  ON exchange_audit_events(request_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_agent_created
  ON exchange_audit_events(agent_id, created_at DESC);

