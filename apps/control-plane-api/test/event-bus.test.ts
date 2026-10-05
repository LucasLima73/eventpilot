import { describe, expect, it } from "vitest";

import { EventBus, type LiveEvent } from "../src/event-bus.js";

function event(overrides: Partial<LiveEvent> = {}): LiveEvent {
  return {
    topic: "order.created",
    key: null,
    value: null,
    correlationId: "abc",
    causationId: null,
    service: null,
    direction: "broker-tail",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("EventBus", () => {
  it("replays history to a new subscriber", () => {
    const bus = new EventBus();
    bus.publish(event());

    const received: LiveEvent[] = [];
    bus.subscribe((e) => received.push(e));

    expect(received).toHaveLength(1);
  });

  it("dedupes a broker-tail event against an SDK produce event for the same topic+correlationId", () => {
    const bus = new EventBus();
    const received: LiveEvent[] = [];
    bus.subscribe((e) => received.push(e));

    bus.publish(event({ direction: "produce", service: "order-service" }));
    bus.publish(event({ direction: "broker-tail", service: null }));

    expect(received).toHaveLength(1);
    expect(received[0].direction).toBe("produce");
  });

  it("never dedupes consume events, even with the same topic+correlationId", () => {
    const bus = new EventBus();
    const received: LiveEvent[] = [];
    bus.subscribe((e) => received.push(e));

    bus.publish(event({ direction: "produce", service: "order-service" }));
    bus.publish(event({ direction: "consume", service: "payment-service" }));
    bus.publish(event({ direction: "consume", service: "shipping-service" }));

    expect(received).toHaveLength(3);
  });

  it("never dedupes events with no correlationId", () => {
    const bus = new EventBus();
    const received: LiveEvent[] = [];
    bus.subscribe((e) => received.push(e));

    bus.publish(event({ correlationId: null }));
    bus.publish(event({ correlationId: null }));

    expect(received).toHaveLength(2);
  });
});
