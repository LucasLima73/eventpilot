import { writeFile } from "node:fs/promises";

import { loadConfig } from "@eventpilot/core";

import { resolveBroker } from "./brokers.js";
import { renderCompose } from "./compose-writer.js";
import { resolveFeature } from "./features.js";
import { writeGeneratedFile } from "./fs-utils.js";
import { resolveGenerator } from "./generators.js";
import { provisionTopics } from "./provision-topics.js";

export interface RegenerateOptions {
  force?: boolean;
}

/**
 * Rewrites docker-compose.yml, provisions topics on the broker (best-effort),
 * and regenerates every service's code plus any enabled feature's files.
 * Shared by `eventpilot generate` and `eventpilot add <feature>` so both stay
 * in sync instead of duplicating this wiring.
 */
export async function regenerateProject(options: RegenerateOptions): Promise<void> {
  const config = await loadConfig("eventpilot.yaml");

  const broker = resolveBroker(config.broker.type);
  await writeFile(
    "docker-compose.yml",
    renderCompose(broker.composeService(config.broker)),
    "utf-8",
  );
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

  const dlqConfig = config.features.dlq ? config.features.dlq : undefined;

  for (const service of config.services) {
    const generator = resolveGenerator(service.language);
    const files = await generator.generate({
      projectName: config.project.name,
      service,
      topics: config.topics,
      outputDir: "services",
      features: dlqConfig ? { dlq: dlqConfig } : undefined,
    });

    for (const file of files) {
      const result = await writeGeneratedFile(file, { force: Boolean(options.force) });
      console.log(`${result === "written" ? "✔" : "·"} ${file.path} (${result})`);
    }
  }

  if (dlqConfig) {
    const feature = resolveFeature("dlq");
    const files = await feature.apply({
      projectName: config.project.name,
      services: config.services,
      config: dlqConfig,
      outputDir: "services",
    });

    for (const file of files) {
      const result = await writeGeneratedFile(file, { force: Boolean(options.force) });
      console.log(`${result === "written" ? "✔" : "·"} ${file.path} (${result})`);
    }
  }
}
