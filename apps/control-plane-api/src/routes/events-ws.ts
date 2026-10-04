import type { FastifyInstance } from "fastify";

import type { LiveTail } from "../live-tail.js";

export function registerEventsWebSocket(app: FastifyInstance, liveTail: LiveTail): void {
  app.get("/ws/events", { websocket: true }, (socket) => {
    const unsubscribe = liveTail.subscribe((event) => {
      socket.send(JSON.stringify(event));
    });
    socket.on("close", unsubscribe);
  });
}
