CREATE TABLE IF NOT EXISTS traffic_counters (
  bucket_hour TEXT NOT NULL,
  host TEXT NOT NULL,
  path_key TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  hits INTEGER NOT NULL DEFAULT 0,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (bucket_hour, host, path_key, method, status_code, country)
);

CREATE INDEX IF NOT EXISTS idx_traffic_counters_last_seen
  ON traffic_counters(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_traffic_counters_path_hour
  ON traffic_counters(path_key, bucket_hour DESC);
