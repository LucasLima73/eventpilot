import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateContracts } from "../src/validate-contracts.js";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const fixture = (name: string) => path.join(fixturesDir, name);

function baseConfig(format: "asyncapi" | "json-schema", schemaPath: string) {
  return {
    version: 1 as const,
    project: { name: "orders-platform" },
    broker: { type: "redpanda", version: "latest" },
    contracts: { format, path: "./contracts" },
    services: [
      { name: "order-service", language: "node-ts", produces: ["order.created"], consumes: [] },
    ],
    topics: [
      { name: "order.created", partitions: 1, retention: "7d", dlq: false, schema: schemaPath },
    ],
    features: { dashboard: false, metrics: false, replay: false },
  };
}

describe("validateContracts", () => {
  it("accepts a valid AsyncAPI contract", async () => {
    const results = await validateContracts(
      baseConfig("asyncapi", fixture("order.created.valid.yaml")),
    );
    expect(results).toEqual([
      {
        topic: "order.created",
        contractPath: fixture("order.created.valid.yaml"),
        ok: true,
        errors: [],
      },
    ]);
  });

  it("reports errors for an invalid AsyncAPI contract", async () => {
    const [result] = await validateContracts(
      baseConfig("asyncapi", fixture("order.created.invalid.yaml")),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("reports a missing contract file", async () => {
    const [result] = await validateContracts(baseConfig("asyncapi", fixture("nope.yaml")));
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/file not found/);
  });

  it("accepts a valid JSON Schema contract", async () => {
    const results = await validateContracts(
      baseConfig("json-schema", fixture("payment.confirmed.valid.json")),
    );
    expect(results[0].ok).toBe(true);
  });

  it("rejects an invalid JSON Schema contract", async () => {
    const [result] = await validateContracts(
      baseConfig("json-schema", fixture("payment.confirmed.invalid.json")),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("skips topics with no declared schema", async () => {
    const config = baseConfig("asyncapi", fixture("order.created.valid.yaml"));
    config.topics[0].schema = undefined;
    expect(await validateContracts(config)).toEqual([]);
  });
});
