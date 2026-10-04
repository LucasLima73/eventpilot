import { OUTBOX_MIGRATION_SQL } from "@pilotevent/feature-outbox";
import { Client } from "pg";

import { OUTBOX_CONNECTION_STRING } from "./postgres-compose.js";

/** Polls Postgres until it accepts connections or the attempts run out. */
export async function waitForPostgres({
  attempts = 15,
  delayMs = 2000,
}: { attempts?: number; delayMs?: number } = {}): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const client = new Client({ connectionString: OUTBOX_CONNECTION_STRING });
    try {
      await client.connect();
      await client.end();
      return;
    } catch (err) {
      lastError = err;
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(
    `Postgres never became reachable after ${attempts} attempts: ${(lastError as Error).message}`,
  );
}

/** Idempotent — safe to run on every `eventpilot up`. */
export async function applyOutboxMigration(): Promise<void> {
  const client = new Client({ connectionString: OUTBOX_CONNECTION_STRING });
  await client.connect();
  try {
    await client.query(OUTBOX_MIGRATION_SQL);
  } finally {
    await client.end();
  }
}
