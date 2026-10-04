import { describe, expect, it } from "vitest";

import { PluginRegistry } from "../src/registry.js";

describe("PluginRegistry", () => {
  it("throws a helpful error, listing available plugins, when a broker is missing", () => {
    const registry = new PluginRegistry();
    registry.registerBroker({ id: "redpanda" } as never);

    expect(() => registry.getBroker("kafka")).toThrowError(/redpanda/);
    expect(() => registry.getBroker("kafka")).toThrowError(/kafka/);
  });

  it("resolves a registered generator by id", () => {
    const registry = new PluginRegistry();
    const generator = { id: "node-ts", generate: async () => [] };
    registry.registerGenerator(generator);

    expect(registry.getGenerator("node-ts")).toBe(generator);
  });
});
