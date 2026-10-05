import path from "node:path";

import { loadConfig } from "@pilotevent/core";
import type { Range } from "@pilotevent/plugin-api";
import type { FastifyInstance } from "fastify";

import { resolveBroker } from "../brokers.js";

interface ReplayQuery {
  topic?: string;
  from?: string;
  to?: string;
  limit?: string;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/** Batch replay for the dashboard — collects up to `limit` events into a single JSON response. */
export function registerReplayRoute(
  app: FastifyInstance,
  projectDir: string,
  brokers: string[],
): void {
  app.get<{ Querystring: ReplayQuery }>("/api/replay", async (request, reply) => {
    const { topic, from, to, limit } = request.query;
    if (!topic) {
      reply.code(400);
      return { error: "missing required query param: topic" };
    }

    const cappedLimit = Math.min(limit ? Number(limit) : DEFAULT_LIMIT, MAX_LIMIT);

    try {
      const config = await loadConfig(path.join(projectDir, "eventpilot.yaml"));
      const broker = resolveBroker(config.broker.type, brokers);

      const range: Range = {};
      if (from !== undefined) range.fromOffset = BigInt(from);
      if (to !== undefined) range.toOffset = BigInt(to);

      const events: Array<{
        key: string | null;
        value: string;
        correlationId: string | null;
        causationId: string | null;
      }> = [];

      for await (const event of broker.readRange(topic, range)) {
        events.push({
          key: event.key ?? null,
          value: event.value.toString(),
          correlationId: event.correlationId ?? null,
          causationId: event.causationId ?? null,
        });
        if (events.length >= cappedLimit) break;
      }

      return events;
    } catch (err) {
      reply.code(500);
      return { error: (err as Error).message };
    }
  });
}
