import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import { EventBus } from "../src/event-bus.js";
import { registerTracesRoute } from "../src/routes/traces.js";

describe("POST /api/traces", () => {
  it("accepts a valid trace event and publishes it to the bus", async () => {
    const bus = new EventBus();
    const received: unknown[] = [];
    bus.subscribe((event) => received.push(event));

    const app = Fastify();
    registerTracesRoute(app, bus);

    const response = await app.inject({
      method: "POST",
      url: "/api/traces",
      payload: {
        service: "order-service",
        direction: "produce",
        topic: "order.created",
        correlationId: "abc",
        causationId: null,
        timestamp: new Date().toISOString(),
      },
    });

    expect(response.statusCode).toBe(202);
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ service: "order-service", topic: "order.created" });
  });

  it("rejects a malformed trace event with a 400", async () => {
    const app = Fastify();
    registerTracesRoute(app, new EventBus());

    const response = await app.inject({
      method: "POST",
      url: "/api/traces",
      payload: { topic: "order.created" },
    });

    expect(response.statusCode).toBe(400);
  });
});
