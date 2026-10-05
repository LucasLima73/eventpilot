import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { EventBus } from "../event-bus.js";

const traceEventSchema = z.object({
  service: z.string().min(1),
  direction: z.enum(["produce", "consume", "error"]),
  topic: z.string().min(1),
  correlationId: z.string().nullable(),
  causationId: z.string().nullable(),
  timestamp: z.string(),
  error: z.string().optional(),
});

/** Ingests trace events pushed by @pilotevent/sdk-node agents. */
export function registerTracesRoute(app: FastifyInstance, bus: EventBus): void {
  app.post("/api/traces", async (request, reply) => {
    const parsed = traceEventSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: parsed.error.message };
    }

    bus.publish({ ...parsed.data, key: null, value: null });
    reply.code(202);
    return { ok: true };
  });
}
