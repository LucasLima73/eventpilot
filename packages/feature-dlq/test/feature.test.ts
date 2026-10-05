import { describe, expect, it } from "vitest";

import { dlqFeature } from "../src/feature.js";

const nodeService = {
  name: "order-service",
  language: "node-ts",
  produces: [],
  consumes: ["payment.confirmed"],
};

const javaService = {
  name: "payment-service",
  language: "java",
  produces: [],
  consumes: ["order.created"],
};

describe("dlqFeature", () => {
  it("generates a dlq.ts helper per Node consuming service with the configured retry options", async () => {
    const files = await dlqFeature.apply({
      projectName: "orders-platform",
      services: [nodeService],
      config: { maxRetries: 3, backoff: "fixed" },
      outputDir: "services",
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("services/order-service/src/dlq.ts");
    expect(files[0].content).toContain("maxRetries: 3");
    expect(files[0].content).toContain('backoff: "fixed"');
    expect(files[0].content).toContain("export function withDlq");
  });

  it("generates a Dlq.java helper per Java consuming service", async () => {
    const files = await dlqFeature.apply({
      projectName: "orders-platform",
      services: [javaService],
      config: { maxRetries: 4, backoff: "exponential" },
      outputDir: "services",
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe(
      "services/payment-service/src/main/java/com/eventpilot/generated/Dlq.java",
    );
    expect(files[0].content).toContain("MAX_RETRIES = 4");
    expect(files[0].content).toContain("public static void withDlq");
  });

  it("applies schema defaults when no config is given", async () => {
    const files = await dlqFeature.apply({
      projectName: "orders-platform",
      services: [nodeService],
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
        nodeService,
        { name: "legacy-service", language: "python", produces: ["x"], consumes: [] },
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
          { name: "legacy-service", language: "python", produces: [], consumes: ["order.created"] },
        ],
        config: {},
        outputDir: "services",
      }),
    ).rejects.toThrow(/doesn't support: legacy-service \(python\)/);
  });
});
