import { GenericContainer, Wait, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createRedpandaAdapter } from "../../src/adapter.js";

/**
 * Redpanda's `--advertise-kafka-addr` has to match the port a client outside the
 * container will actually use, so we pin a fixed host port instead of letting
 * testcontainers assign a random one (simpler than the two-phase "start, discover the
 * mapped port, then exec the real start command" dance the official Kafka modules do).
 *
 * Locally, if this fails with "Could not setup Async I/O" / aio-max-nr exhausted, it's
 * the kernel's AIO context limit (`cat /proc/sys/fs/aio-max-nr`) — each running Redpanda
 * container eats into it. Stop other Redpanda containers (`eventpilot down` in whatever
 * project has one up) and retry; fresh CI runners don't have this problem.
 */
const HOST_PORT = 19092;

let container: StartedTestContainer;

beforeAll(async () => {
  container = await new GenericContainer("docker.redpanda.com/redpandadata/redpanda:latest")
    .withExposedPorts({ container: 9092, host: HOST_PORT })
    .withCommand([
      "redpanda",
      "start",
      "--mode",
      "dev-container",
      "--kafka-addr",
      "PLAINTEXT://0.0.0.0:9092",
      "--advertise-kafka-addr",
      `PLAINTEXT://localhost:${HOST_PORT}`,
    ])
    .withWaitStrategy(Wait.forLogMessage(/Successfully started Redpanda!/))
    .withStartupTimeout(45_000)
    .start();
}, 60_000);

afterAll(async () => {
  await container?.stop();
});

describe("broker-redpanda against a real Redpanda container", () => {
  it("creates a topic, publishes, lists it, and replays what was published", async () => {
    const broker = createRedpandaAdapter({ brokers: [`localhost:${HOST_PORT}`] });

    await broker.createTopic({ name: "integration.created", partitions: 1, retention: "7d" });

    const topics = await broker.listTopics();
    expect(topics.map((t) => t.name)).toContain("integration.created");

    await broker.publish("integration.created", {
      topic: "integration.created",
      key: "k1",
      value: JSON.stringify({ hello: "world" }),
      correlationId: "corr-1",
    });

    const replayed: string[] = [];
    for await (const event of broker.readRange("integration.created", {})) {
      replayed.push(event.value.toString());
    }

    expect(replayed).toEqual([JSON.stringify({ hello: "world" })]);
  });

  it("measures real metrics for a topic", async () => {
    const broker = createRedpandaAdapter({ brokers: [`localhost:${HOST_PORT}`] });
    await broker.createTopic({ name: "integration.metrics", partitions: 1, retention: "7d" });

    const metrics = await broker.getMetrics("integration.metrics");

    expect(metrics.topic).toBe("integration.metrics");
    expect(metrics.consumerLag).toBe(0);
    expect(metrics.dlqCount).toBe(0);
    expect(metrics.errorCount).toBe(0);
  });
});
