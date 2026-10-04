import { describe, expect, it, vi } from "vitest";

import { provisionTopics, waitForBroker } from "../src/provision-topics.js";

function fakeBroker(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "fake",
    composeService: vi.fn(),
    createTopic: vi.fn().mockResolvedValue(undefined),
    listTopics: vi.fn().mockResolvedValue([]),
    getMetrics: vi.fn(),
    readRange: vi.fn(),
    publish: vi.fn(),
    ...overrides,
  };
}

describe("provisionTopics", () => {
  it("creates every topic, and a .dlq topic for topics with dlq: true", async () => {
    const broker = fakeBroker();

    const created = await provisionTopics(broker as never, [
      { name: "order.created", partitions: 3, retention: "7d", dlq: true },
      { name: "payment.confirmed", partitions: 1, retention: "7d", dlq: false },
    ]);

    expect(created).toEqual(["order.created", "order.created.dlq", "payment.confirmed"]);
    expect(broker.createTopic).toHaveBeenCalledTimes(3);
    expect(broker.createTopic).toHaveBeenCalledWith({
      name: "order.created.dlq",
      partitions: 3,
      retention: "7d",
    });
  });

  it("returns an empty list for no topics", async () => {
    const broker = fakeBroker();
    expect(await provisionTopics(broker as never, [])).toEqual([]);
    expect(broker.createTopic).not.toHaveBeenCalled();
  });
});

describe("waitForBroker", () => {
  it("resolves as soon as the broker responds", async () => {
    const broker = fakeBroker();
    await waitForBroker(broker as never, { attempts: 3, delayMs: 1 });
    expect(broker.listTopics).toHaveBeenCalledTimes(1);
  });

  it("retries and eventually throws a readable error if the broker never responds", async () => {
    const broker = fakeBroker({ listTopics: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) });

    await expect(waitForBroker(broker as never, { attempts: 2, delayMs: 1 })).rejects.toThrow(
      /never became reachable after 2 attempts/,
    );
    expect(broker.listTopics).toHaveBeenCalledTimes(2);
  });
});
