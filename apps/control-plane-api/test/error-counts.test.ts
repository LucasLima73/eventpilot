import { describe, expect, it } from "vitest";

import { ErrorCounts } from "../src/error-counts.js";
import { EventBus } from "../src/event-bus.js";

function baseEvent(overrides: Partial<Parameters<EventBus["publish"]>[0]> = {}) {
  return {
    topic: "order.created",
    key: null,
    value: null,
    correlationId: "corr-1",
    causationId: null,
    service: "order-service",
    direction: "error" as const,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("ErrorCounts", () => {
  it("starts at 0 for a topic with no errors", () => {
    const counts = new ErrorCounts(new EventBus());
    expect(counts.get("order.created")).toBe(0);
  });

  it("increments on each error event for that topic", () => {
    const bus = new EventBus();
    const counts = new ErrorCounts(bus);

    bus.publish(baseEvent());
    bus.publish(baseEvent({ correlationId: "corr-2" }));

    expect(counts.get("order.created")).toBe(2);
  });

  it("ignores non-error events", () => {
    const bus = new EventBus();
    const counts = new ErrorCounts(bus);

    bus.publish(baseEvent({ direction: "produce" }));
    bus.publish(baseEvent({ direction: "consume" }));

    expect(counts.get("order.created")).toBe(0);
  });

  it("tracks separate topics independently", () => {
    const bus = new EventBus();
    const counts = new ErrorCounts(bus);

    bus.publish(baseEvent({ topic: "order.created" }));
    bus.publish(baseEvent({ topic: "payment.confirmed" }));

    expect(counts.get("order.created")).toBe(1);
    expect(counts.get("payment.confirmed")).toBe(1);
    expect(counts.get("nope")).toBe(0);
  });
});
