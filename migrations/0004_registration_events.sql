CREATE TABLE IF NOT EXISTS registration_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  agent_id TEXT,
  country TEXT,
  user_agent_hash TEXT,
  issue_summary TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_registration_events_created
  ON registration_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_events_type_created
  ON registration_events(event_type, created_at DESC);
