import type { FastifyInstance } from "fastify";

import type { EventBus } from "../event-bus.js";

export function registerEventsWebSocket(app: FastifyInstance, bus: EventBus): void {
  app.get("/ws/events", { websocket: true }, (socket) => {
    const unsubscribe = bus.subscribe((event) => {
      socket.send(JSON.stringify(event));
    });
    socket.on("close", unsubscribe);
  });
}
