import { writeFile } from "node:fs/promises";

import { loadConfig } from "@eventpilot/core";

import { resolveBroker } from "./brokers.js";
import { mergeFragments, renderCompose } from "./compose-writer.js";
import { resolveFeature } from "./features.js";
import { writeGeneratedFile } from "./fs-utils.js";
import { resolveGenerator } from "./generators.js";
import { postgresCompose } from "./postgres-compose.js";
import { provisionTopics } from "./provision-topics.js";

export interface RegenerateOptions {
  force?: boolean;
}

async function writeFiles(files: { path: string; content: string }[], force: boolean) {
  for (const file of files) {
    const result = await writeGeneratedFile(file, { force });
    console.log(`${result === "written" ? "✔" : "·"} ${file.path} (${result})`);
  }
}

/**
 * Rewrites docker-compose.yml, provisions topics on the broker (best-effort),
 * and regenerates every service's code plus any enabled feature's files.
 * Shared by `eventpilot generate` and `eventpilot add <feature>` so both stay
 * in sync instead of duplicating this wiring.
 */
export async function regenerateProject(options: RegenerateOptions): Promise<void> {
  const config = await loadConfig("eventpilot.yaml");
  const force = Boolean(options.force);

  const broker = resolveBroker(config.broker.type);
  const dlqConfig = config.features.dlq ? config.features.dlq : undefined;
  const outboxConfig = config.features.outbox ? config.features.outbox : undefined;

  const composeFragment = outboxConfig
    ? mergeFragments(broker.composeService(config.broker), postgresCompose())
    : broker.composeService(config.broker);
  await writeFile("docker-compose.yml", renderCompose(composeFragment), "utf-8");
  console.log("✔ docker-compose.yml regenerated");

  try {
    const created = await provisionTopics(broker, config.topics);
    if (created.length > 0) console.log(`✔ topics ready: ${created.join(", ")}`);
  } catch (err) {
    console.warn(
      `· couldn't reach the broker to provision topics (${(err as Error).message}). ` +
        "Run `eventpilot up` first, or `eventpilot generate` again once it's running.",
    );
  }

  for (const service of config.services) {
    const generator = resolveGenerator(service.language);
    const files = await generator.generate({
      projectName: config.project.name,
      service,
      topics: config.topics,
      outputDir: "services",
      features: {
        ...(dlqConfig ? { dlq: dlqConfig } : {}),
        ...(outboxConfig ? { outbox: true } : {}),
      },
    });
    await writeFiles(files, force);
  }

  if (dlqConfig) {
    const files = await resolveFeature("dlq").apply({
      projectName: config.project.name,
      services: config.services,
      config: dlqConfig,
      outputDir: "services",
    });
    await writeFiles(files, force);
  }

  if (outboxConfig) {
    const files = await resolveFeature("outbox").apply({
      projectName: config.project.name,
      services: config.services,
      config: outboxConfig,
      outputDir: "services",
    });
    await writeFiles(files, force);
  }
}
