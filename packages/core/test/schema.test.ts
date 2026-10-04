import { describe, expect, it } from "vitest";

import { parseConfig } from "../src/loader.js";

const validConfig = {
  version: 1,
  project: { name: "orders-platform" },
  broker: { type: "redpanda", version: "latest" },
  contracts: { format: "asyncapi", path: "./contracts" },
  services: [
    {
      name: "order-service",
      language: "node-ts",
      produces: ["order.created", "order.cancelled"],
      consumes: ["payment.confirmed"],
    },
    {
      name: "payment-service",
      language: "java",
      produces: ["payment.confirmed"],
      consumes: ["order.created"],
    },
  ],
  topics: [
    {
      name: "order.created",
      partitions: 3,
      retention: "7d",
      schema: "./contracts/order.created.json",
      dlq: true,
    },
  ],
  features: {
    dashboard: true,
    metrics: true,
    dlq: { maxRetries: 5, backoff: "exponential" },
    outbox: { enabled: true, store: "postgres" },
    replay: true,
  },
};

describe("eventPilotConfigSchema", () => {
  it("accepts the reference config from CLAUDE.md section 7", () => {
    const parsed = parseConfig(validConfig);
    expect(parsed.project.name).toBe("orders-platform");
    expect(parsed.topics[0].partitions).toBe(3);
  });

  it("fills in defaults for an otherwise-minimal config", () => {
    const parsed = parseConfig({
      version: 1,
      project: { name: "minimal" },
      broker: { type: "redpanda", version: "latest" },
      contracts: { format: "asyncapi", path: "./contracts" },
      services: [{ name: "svc", language: "node-ts" }],
    });
    expect(parsed.topics).toEqual([]);
    expect(parsed.features.dashboard).toBe(false);
    expect(parsed.services[0].produces).toEqual([]);
  });

  it("rejects an unknown version with a readable error", () => {
    expect(() => parseConfig({ ...validConfig, version: 2 })).toThrowError(/version/);
  });

  it("rejects a project with no services", () => {
    expect(() => parseConfig({ ...validConfig, services: [] })).toThrowError(
      /at least one service/,
    );
  });

  it("rejects a malformed retention string", () => {
    expect(() =>
      parseConfig({
        ...validConfig,
        topics: [{ ...validConfig.topics[0], retention: "forever" }],
      }),
    ).toThrowError(/duration/);
  });

  it("lists every problem in one error, with the field path", () => {
    try {
      parseConfig({ version: 1, project: {}, broker: {}, contracts: {}, services: [] });
      throw new Error("expected parseConfig to throw");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toMatch(/project.name/);
      expect(message).toMatch(/broker.type/);
      expect(message).toMatch(/contracts.format/);
    }
  });
});
