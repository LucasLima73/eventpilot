import { describe, expect, it } from "vitest";

import { javaGenerator } from "../src/generator.js";

describe("javaGenerator", () => {
  it("generates a Gradle project with producer, consumer and main classes", async () => {
    const files = await javaGenerator.generate({
      projectName: "orders-platform",
      service: {
        name: "payment-service",
        language: "java",
        produces: ["payment.confirmed"],
        consumes: ["order.created"],
      },
      topics: [],
      outputDir: "services",
    });

    const paths = files.map((f) => f.path);
    expect(paths).toEqual([
      "services/payment-service/build.gradle",
      "services/payment-service/settings.gradle",
      "services/payment-service/src/main/java/com/eventpilot/generated/PaymentServiceProducer.java",
      "services/payment-service/src/main/java/com/eventpilot/generated/PaymentServiceConsumer.java",
      "services/payment-service/src/main/java/com/eventpilot/generated/PaymentServiceMain.java",
    ]);

    const producer = files.find((f) => f.path.endsWith("Producer.java"))!;
    expect(producer.content).toContain("publishPaymentConfirmed");

    const consumer = files.find((f) => f.path.endsWith("Consumer.java"))!;
    expect(consumer.content).toContain('"order.created"');

    const buildGradle = files.find((f) => f.path.endsWith("build.gradle"))!;
    expect(buildGradle.content).toContain(
      "mainClass = 'com.eventpilot.generated.PaymentServiceMain'",
    );
  });
});
