CREATE TABLE IF NOT EXISTS capability_requests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  proposed_capability TEXT NOT NULL,
  example_use_case TEXT,
  category TEXT NOT NULL DEFAULT 'platform',
  status TEXT NOT NULL DEFAULT 'open',
  created_by_agent_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by_agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_capability_requests_status_created
  ON capability_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_capability_requests_creator
  ON capability_requests(created_by_agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS capability_votes (
  request_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (request_id, agent_id),
  FOREIGN KEY (request_id) REFERENCES capability_requests(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_capability_votes_agent
  ON capability_votes(agent_id, updated_at DESC);
