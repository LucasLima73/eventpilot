import { describe, expect, it } from "vitest";

import { outboxFeature } from "../src/feature.js";

describe("outboxFeature", () => {
  it("generates outbox.ts and outbox-relay.ts for services that produce events", async () => {
    const files = await outboxFeature.apply({
      projectName: "orders-platform",
      services: [
        { name: "order-service", language: "node-ts", produces: ["order.created"], consumes: [] },
        { name: "metrics-reader", language: "node-ts", produces: [], consumes: ["order.created"] },
      ],
      config: { enabled: true, store: "postgres" },
      outputDir: "services",
    });

    expect(files.map((f) => f.path)).toEqual([
      "services/order-service/src/outbox.ts",
      "services/order-service/src/outbox-relay.ts",
    ]);
    expect(files[0].content).toContain("export async function writeOutbox");
    expect(files[0].content).toContain("CREATE TABLE IF NOT EXISTS outbox");
    expect(files[1].content).toContain("export function startOutboxRelay");
  });

  it("returns nothing when no service produces events", async () => {
    const files = await outboxFeature.apply({
      projectName: "orders-platform",
      services: [{ name: "svc", language: "node-ts", produces: [], consumes: ["x"] }],
      config: {},
      outputDir: "services",
    });
    expect(files).toEqual([]);
  });

  it("generates Outbox.java and OutboxRelay.java for a Java producer", async () => {
    const files = await outboxFeature.apply({
      projectName: "orders-platform",
      services: [
        {
          name: "payment-service",
          language: "java",
          produces: ["payment.confirmed"],
          consumes: [],
        },
      ],
      config: { enabled: true, store: "postgres" },
      outputDir: "services",
    });

    expect(files.map((f) => f.path)).toEqual([
      "services/payment-service/src/main/java/com/eventpilot/generated/Outbox.java",
      "services/payment-service/src/main/java/com/eventpilot/generated/OutboxRelay.java",
    ]);
    expect(files[0].content).toContain("public static void writeOutbox");
    expect(files[0].content).toContain("CREATE TABLE IF NOT EXISTS outbox");
    expect(files[1].content).toContain("class OutboxRelay");
  });

  it("throws a clear error for an unsupported language", async () => {
    await expect(
      outboxFeature.apply({
        projectName: "orders-platform",
        services: [
          {
            name: "legacy-service",
            language: "python",
            produces: ["payment.confirmed"],
            consumes: [],
          },
        ],
        config: {},
        outputDir: "services",
      }),
    ).rejects.toThrow(/doesn't support: legacy-service \(python\)/);
  });
});
