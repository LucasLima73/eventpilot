import { writeFile } from "node:fs/promises";

import { loadConfig } from "@pilotevent/core";
import { stringify } from "yaml";

import { implementedFeatures } from "../features.js";
import { regenerateProject } from "../regenerate.js";

export interface AddOptions {
  force?: boolean;
}

function enableDlq(config: Awaited<ReturnType<typeof loadConfig>>): string[] {
  const notes: string[] = [];

  const consumedTopics = new Set(config.services.flatMap((service) => service.consumes));
  const newlyFlagged = config.topics.filter(
    (topic) => consumedTopics.has(topic.name) && !topic.dlq,
  );
  for (const topic of newlyFlagged) topic.dlq = true;
  if (newlyFlagged.length > 0) {
    notes.push(
      `✔ marked consumed topic(s) as dlq: true so their .dlq topic gets provisioned: ${newlyFlagged
        .map((t) => t.name)
        .join(", ")}`,
    );
  }

  if (!config.features.dlq) {
    config.features.dlq = { maxRetries: 5, backoff: "exponential" };
    notes.push("✔ enabled dlq in eventpilot.yaml (maxRetries: 5, backoff: exponential)");
  } else {
    notes.push("dlq is already enabled in eventpilot.yaml — regenerating.");
  }

  return notes;
}

function enableOutbox(config: Awaited<ReturnType<typeof loadConfig>>): string[] {
  if (!config.features.outbox) {
    config.features.outbox = { enabled: true, store: "postgres" };
    return ["✔ enabled outbox in eventpilot.yaml (store: postgres)"];
  }
  return ["outbox is already enabled in eventpilot.yaml — regenerating."];
}

const ENABLERS: Record<string, (config: Awaited<ReturnType<typeof loadConfig>>) => string[]> = {
  dlq: enableDlq,
  outbox: enableOutbox,
};

export async function add(feature: string, options: AddOptions): Promise<void> {
  const enable = ENABLERS[feature];
  if (!enable) {
    console.error(
      `\`eventpilot add ${feature}\` isn't implemented yet. Implemented: ${implementedFeatures().join(", ")}.\n` +
        "metrics and replay are planned for later phases — see CLAUDE.md, section 10.",
    );
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig("eventpilot.yaml");
  const notes = enable(config);
  await writeFile("eventpilot.yaml", stringify(config), "utf-8");
  for (const note of notes) console.log(note);

  await regenerateProject(options);

  if (!options.force) {
    console.log(
      "\nNote: files that already existed were skipped above (producer/consumer/package.json " +
        "may need the new wiring). Run `eventpilot add " +
        feature +
        " --force` (or `eventpilot generate --force`) to overwrite them.",
    );
  }
}
