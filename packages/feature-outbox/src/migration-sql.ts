/** Outbox table schema — the single source of truth, reused both in the generated outbox.ts and by `eventpilot up` to apply it automatically. */
export const OUTBOX_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS outbox (
  id BIGSERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  key TEXT,
  payload JSONB NOT NULL,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id TEXT,
  causation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS outbox_unpublished_idx ON outbox (id) WHERE published_at IS NULL;
`.trim();
