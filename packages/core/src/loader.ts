import { readFile } from "node:fs/promises";

import { parse as parseYaml } from "yaml";
import type { ZodError } from "zod";

import { EventPilotConfigError } from "./errors.js";
import { type EventPilotConfig, eventPilotConfigSchema } from "./schema.js";

function formatZodError(error: ZodError, filePath?: string): string {
  const where = filePath ? ` in ${filePath}` : "";
  const issues = error.issues
    .map((issue) => `  - ${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .join("\n");
  return `Invalid eventpilot.yaml${where}:\n${issues}\n\nFix the fields above and run \`eventpilot validate\` again.`;
}

/** Validates an already-parsed object against the EventPilot config schema. */
export function parseConfig(raw: unknown, filePath?: string): EventPilotConfig {
  const result = eventPilotConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new EventPilotConfigError(formatZodError(result.error, filePath), filePath);
  }
  return result.data;
}

/** Reads, parses and validates an eventpilot.yaml file from disk. */
export async function loadConfig(filePath: string): Promise<EventPilotConfig> {
  let text: string;
  try {
    text = await readFile(filePath, "utf-8");
  } catch (err) {
    throw new EventPilotConfigError(
      `Could not read ${filePath}: ${(err as Error).message}\nRun \`eventpilot init\` to create one.`,
      filePath,
    );
  }

  let raw: unknown;
  try {
    raw = parseYaml(text);
  } catch (err) {
    throw new EventPilotConfigError(
      `${filePath} is not valid YAML: ${(err as Error).message}`,
      filePath,
    );
  }

  return parseConfig(raw, filePath);
}
