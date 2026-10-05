import path from "node:path";

import { loadConfig } from "@pilotevent/core";
import type { FastifyInstance } from "fastify";

import { resolveBroker } from "../brokers.js";
import type { ErrorCounts } from "../error-counts.js";

interface MetricsQuery {
  topic?: string;
}

/** Merges the broker's getMetrics() (throughput/lag/dlq) with errorCount tracked from SDK traces. */
export function registerMetricsRoute(
  app: FastifyInstance,
  projectDir: string,
  brokers: string[],
  errorCounts: ErrorCounts,
): void {
  app.get<{ Querystring: MetricsQuery }>("/api/metrics", async (request, reply) => {
    const { topic } = request.query;
    if (!topic) {
      reply.code(400);
      return { error: "missing required query param: topic" };
    }

    try {
      const config = await loadConfig(path.join(projectDir, "eventpilot.yaml"));
      const broker = resolveBroker(config.broker.type, brokers);
      const metrics = await broker.getMetrics(topic);
      return { ...metrics, errorCount: errorCounts.get(topic) };
    } catch (err) {
      reply.code(500);
      return { error: (err as Error).message };
    }
  });
}
