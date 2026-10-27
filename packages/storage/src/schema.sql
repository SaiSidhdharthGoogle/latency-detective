CREATE TABLE IF NOT EXISTS latency_events (
  id BIGSERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  operation TEXT NOT NULL,
  duration_ms DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  trace_id TEXT,
  success BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_latency_events_timestamp
  ON latency_events (timestamp);

CREATE INDEX IF NOT EXISTS idx_latency_events_operation
  ON latency_events (operation);

CREATE INDEX IF NOT EXISTS idx_latency_events_service
  ON latency_events (service);
