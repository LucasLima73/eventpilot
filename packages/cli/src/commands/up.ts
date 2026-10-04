import { loadConfig } from "@eventpilot/core";

import { resolveBroker } from "../brokers.js";
import { ensureComposeFileExists, runDockerCompose } from "../docker-runner.js";
import { applyOutboxMigration, waitForPostgres } from "../postgres-migrate.js";
import { provisionTopics, waitForBroker } from "../provision-topics.js";

export async function up(): Promise<void> {
  ensureComposeFileExists();
  await runDockerCompose(["up", "-d"]);

  const config = await loadConfig("eventpilot.yaml");
  const broker = resolveBroker(config.broker.type);

  console.log("Waiting for the broker to be ready...");
  await waitForBroker(broker);

  const created = await provisionTopics(broker, config.topics);
  if (created.length > 0) {
    console.log(`✔ topics ready: ${created.join(", ")}`);
  }

  if (config.features.outbox) {
    console.log("Waiting for Postgres to be ready...");
    await waitForPostgres();
    await applyOutboxMigration();
    console.log("✔ outbox table ready");
  }
}
