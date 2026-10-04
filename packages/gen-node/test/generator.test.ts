import { describe, expect, it } from "vitest";

import { nodeTsGenerator } from "../src/generator.js";

describe("nodeTsGenerator", () => {
  it("generates producer, consumer, entrypoint and package files", async () => {
    const files = await nodeTsGenerator.generate({
      projectName: "orders-platform",
      service: {
        name: "order-service",
        language: "node-ts",
        produces: ["order.created", "order.cancelled"],
        consumes: ["payment.confirmed"],
      },
      topics: [],
      outputDir: "services",
    });

    const paths = files.map((f) => f.path);
    expect(paths).toEqual([
      "services/order-service/src/producer.ts",
      "services/order-service/src/consumer.ts",
      "services/order-service/src/index.ts",
      "services/order-service/package.json",
      "services/order-service/tsconfig.json",
    ]);

    const producer = files.find((f) => f.path.endsWith("producer.ts"))!;
    expect(producer.content).toContain("publishOrderCreated");
    expect(producer.content).toContain("publishOrderCancelled");

    const consumer = files.find((f) => f.path.endsWith("consumer.ts"))!;
    expect(consumer.content).toContain('"payment.confirmed"');

    const packageJson = files.find((f) => f.path.endsWith("package.json"))!;
    expect(JSON.parse(packageJson.content).name).toBe("orders-platform-order-service");
  });
});
