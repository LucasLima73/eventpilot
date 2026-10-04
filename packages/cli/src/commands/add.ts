import { writeFile } from "node:fs/promises";

import { loadConfig } from "@eventpilot/core";
import { stringify } from "yaml";

import { implementedFeatures } from "../features.js";
import { regenerateProject } from "../regenerate.js";

export interface AddOptions {
  force?: boolean;
}

export async function add(feature: string, options: AddOptions): Promise<void> {
  if (feature !== "dlq") {
    console.error(
      `\`eventpilot add ${feature}\` isn't implemented yet. Implemented: ${implementedFeatures().join(", ")}.\n` +
        "outbox, metrics and replay are planned for later phases — see CLAUDE.md, section 10.",
    );
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig("eventpilot.yaml");

  const consumedTopics = new Set(config.services.flatMap((service) => service.consumes));
  const newlyFlagged = config.topics.filter((topic) => consumedTopics.has(topic.name) && !topic.dlq);
  for (const topic of newlyFlagged) topic.dlq = true;

  const alreadyEnabled = Boolean(config.features.dlq);
  if (!alreadyEnabled) config.features.dlq = { maxRetries: 5, backoff: "exponential" };

  if (!alreadyEnabled || newlyFlagged.length > 0) {
    await writeFile("eventpilot.yaml", stringify(config), "utf-8");
  }
  if (!alreadyEnabled) {
    console.log("✔ enabled dlq in eventpilot.yaml (maxRetries: 5, backoff: exponential)");
  } else {
    console.log("dlq is already enabled in eventpilot.yaml — regenerating.");
  }
  if (newlyFlagged.length > 0) {
    console.log(
      `✔ marked consumed topic(s) as dlq: true so their .dlq topic gets provisioned: ${newlyFlagged
        .map((t) => t.name)
        .join(", ")}`,
    );
  }

  await regenerateProject(options);

  if (!options.force) {
    console.log(
      "\nNote: consumer.ts already existed, so it was skipped above. Run " +
        "`eventpilot add dlq --force` (or `eventpilot generate --force`) to rewire it to use the DLQ helper.",
    );
  }
}
