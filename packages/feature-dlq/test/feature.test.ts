import { describe, expect, it } from "vitest";

import { dlqFeature } from "../src/feature.js";

const service = {
  name: "order-service",
  language: "node-ts",
  produces: [],
  consumes: ["payment.confirmed"],
};

describe("dlqFeature", () => {
  it("generates a dlq.ts helper per consuming service with the configured retry options", async () => {
    const files = await dlqFeature.apply({
      projectName: "orders-platform",
      services: [service],
      config: { maxRetries: 3, backoff: "fixed" },
      outputDir: "services",
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("services/order-service/src/dlq.ts");
    expect(files[0].content).toContain("maxRetries: 3");
    expect(files[0].content).toContain('backoff: "fixed"');
    expect(files[0].content).toContain("export function withDlq");
  });

  it("applies schema defaults when no config is given", async () => {
    const files = await dlqFeature.apply({
      projectName: "orders-platform",
      services: [service],
      config: undefined,
      outputDir: "services",
    });

    expect(files[0].content).toContain("maxRetries: 5");
    expect(files[0].content).toContain('backoff: "exponential"');
  });

  it("ignores a pure producer in an unsupported language", async () => {
    const files = await dlqFeature.apply({
      projectName: "orders-platform",
      services: [
        service,
        {
          name: "payment-service",
          language: "java",
          produces: ["payment.confirmed"],
          consumes: [],
        },
      ],
      config: {},
      outputDir: "services",
    });

    expect(files.map((f) => f.path)).toEqual(["services/order-service/src/dlq.ts"]);
  });

  it("throws a clear error for an unsupported language that consumes events", async () => {
    await expect(
      dlqFeature.apply({
        projectName: "orders-platform",
        services: [
          { name: "payment-service", language: "java", produces: [], consumes: ["order.created"] },
        ],
        config: {},
        outputDir: "services",
      }),
    ).rejects.toThrow(/doesn't support: payment-service \(java\)/);
  });
});
