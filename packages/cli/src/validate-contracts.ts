import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import type { EventPilotConfig } from "@pilotevent/core";
import { fromFile, Parser } from "@asyncapi/parser";
import { Ajv } from "ajv";

export interface ContractCheckResult {
  topic: string;
  contractPath: string;
  ok: boolean;
  errors: string[];
}

/** Validates each topic's declared contract file (`topics[].schema`) against `contracts.format`. */
export async function validateContracts(config: EventPilotConfig): Promise<ContractCheckResult[]> {
  const results: ContractCheckResult[] = [];

  for (const topic of config.topics) {
    if (!topic.schema) continue;

    results.push(
      config.contracts.format === "asyncapi"
        ? await validateAsyncApi(topic.name, topic.schema)
        : await validateJsonSchema(topic.name, topic.schema),
    );
  }

  return results;
}

async function validateAsyncApi(topic: string, contractPath: string): Promise<ContractCheckResult> {
  if (!existsSync(contractPath)) {
    return { topic, contractPath, ok: false, errors: [`file not found: ${contractPath}`] };
  }

  const parser = new Parser();
  const { diagnostics } = await fromFile(parser, contractPath).parse();
  const errors = diagnostics
    .filter((d) => d.severity === 0)
    .map((d) => `${d.message}${d.path?.length ? ` (at ${d.path.join(".")})` : ""}`);

  return { topic, contractPath, ok: errors.length === 0, errors };
}

async function validateJsonSchema(
  topic: string,
  contractPath: string,
): Promise<ContractCheckResult> {
  if (!existsSync(contractPath)) {
    return { topic, contractPath, ok: false, errors: [`file not found: ${contractPath}`] };
  }

  try {
    const raw = await readFile(contractPath, "utf-8");
    const schema = JSON.parse(raw) as Record<string, unknown>;
    const ajv = new Ajv({ strict: false });
    ajv.compile(schema);
    return { topic, contractPath, ok: true, errors: [] };
  } catch (err) {
    return { topic, contractPath, ok: false, errors: [(err as Error).message] };
  }
}
