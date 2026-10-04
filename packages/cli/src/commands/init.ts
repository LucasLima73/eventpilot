import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";

import * as p from "@clack/prompts";
import { parseConfig } from "@eventpilot/core";
import { stringify } from "yaml";

import { resolveBroker } from "../brokers.js";
import { renderCompose } from "../compose-writer.js";
import { writeGeneratedFile } from "../fs-utils.js";
import { resolveGenerator } from "../generators.js";

export interface InitOptions {
  force?: boolean;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function init(options: InitOptions): Promise<void> {
  if (existsSync("eventpilot.yaml") && !options.force) {
    console.error(
      "eventpilot.yaml already exists. Use `eventpilot init --force` to overwrite, " +
        "or `eventpilot add <feature>` to extend the existing project.",
    );
    process.exitCode = 1;
    return;
  }

  p.intro("EventPilot — set up a new event-driven project");

  const projectName = await p.text({
    message: "Project name",
    placeholder: "orders-platform",
    validate: (value) => (value.trim().length === 0 ? "Required" : undefined),
  });
  if (p.isCancel(projectName)) {
    p.cancel("Cancelled.");
    return;
  }

  const serviceName = await p.text({
    message: "First service name",
    placeholder: "order-service",
    initialValue: "order-service",
    validate: (value) => (value.trim().length === 0 ? "Required" : undefined),
  });
  if (p.isCancel(serviceName)) {
    p.cancel("Cancelled.");
    return;
  }

  const languageChoice = await p.select({
    message: `Language for "${serviceName}"`,
    options: [
      { value: "node-ts", label: "Node / TypeScript" },
      { value: "java", label: "Java (Gradle)" },
    ],
    initialValue: "node-ts",
  });
  if (p.isCancel(languageChoice)) {
    p.cancel("Cancelled.");
    return;
  }
  const language = languageChoice as "node-ts" | "java";

  const producesRaw = await p.text({
    message: `Events "${serviceName}" produces (comma-separated, leave empty if none)`,
    placeholder: "order.created, order.cancelled",
  });
  if (p.isCancel(producesRaw)) {
    p.cancel("Cancelled.");
    return;
  }

  const consumesRaw = await p.text({
    message: `Events "${serviceName}" consumes (comma-separated, leave empty if none)`,
    placeholder: "payment.confirmed",
  });
  if (p.isCancel(consumesRaw)) {
    p.cancel("Cancelled.");
    return;
  }

  const contractsFormatChoice = await p.select({
    message: "Contract format",
    options: [
      { value: "asyncapi", label: "AsyncAPI" },
      { value: "json-schema", label: "JSON Schema" },
    ],
    initialValue: "asyncapi",
  });
  if (p.isCancel(contractsFormatChoice)) {
    p.cancel("Cancelled.");
    return;
  }
  const contractsFormat = contractsFormatChoice as "asyncapi" | "json-schema";

  const produces = splitList(producesRaw);
  const consumes = splitList(consumesRaw);
  const topicNames = [...new Set([...produces, ...consumes])];

  const config = parseConfig({
    version: 1,
    project: { name: projectName.trim() },
    broker: { type: "redpanda", version: "latest" },
    contracts: { format: contractsFormat, path: "./contracts" },
    services: [
      {
        name: serviceName.trim(),
        language,
        produces,
        consumes,
      },
    ],
    topics: topicNames.map((name) => ({ name, partitions: 1, retention: "7d", dlq: false })),
    features: {},
  });

  await writeFile("eventpilot.yaml", stringify(config), "utf-8");

  const broker = resolveBroker(config.broker.type);
  await writeFile(
    "docker-compose.yml",
    renderCompose(broker.composeService(config.broker)),
    "utf-8",
  );

  const generator = resolveGenerator(config.services[0].language);
  const files = await generator.generate({
    projectName: config.project.name,
    service: config.services[0],
    topics: config.topics,
    outputDir: "services",
  });

  for (const file of files) {
    await writeGeneratedFile(file, { force: Boolean(options.force) });
  }

  p.outro(
    [
      `Created eventpilot.yaml, docker-compose.yml and services/${config.services[0].name}/`,
      "",
      "Next steps:",
      "  eventpilot doctor     # check Docker is ready",
      "  eventpilot up         # start Redpanda locally",
      "  eventpilot generate   # regenerate code after editing eventpilot.yaml",
    ].join("\n"),
  );
}
