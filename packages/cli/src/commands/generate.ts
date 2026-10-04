import { writeFile } from "node:fs/promises";

import { loadConfig } from "@eventpilot/core";

import { resolveBroker } from "../brokers.js";
import { renderCompose } from "../compose-writer.js";
import { writeGeneratedFile } from "../fs-utils.js";
import { resolveGenerator } from "../generators.js";

export interface GenerateOptions {
  force?: boolean;
}

export async function generate(options: GenerateOptions): Promise<void> {
  const config = await loadConfig("eventpilot.yaml");

  const broker = resolveBroker(config.broker.type);
  await writeFile(
    "docker-compose.yml",
    renderCompose(broker.composeService(config.broker)),
    "utf-8",
  );
  console.log("✔ docker-compose.yml regenerated");

  for (const service of config.services) {
    const generator = resolveGenerator(service.language);
    const files = await generator.generate({
      projectName: config.project.name,
      service,
      topics: config.topics,
      outputDir: "services",
    });

    for (const file of files) {
      const result = await writeGeneratedFile(file, { force: Boolean(options.force) });
      console.log(`${result === "written" ? "✔" : "·"} ${file.path} (${result})`);
    }
  }
}
