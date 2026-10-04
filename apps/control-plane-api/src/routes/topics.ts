import path from "node:path";

import { loadConfig } from "@pilotevent/core";
import type { FastifyInstance } from "fastify";

import { resolveBroker } from "../brokers.js";

export function registerTopicsRoute(
  app: FastifyInstance,
  projectDir: string,
  brokers: string[],
): void {
  app.get("/api/topics", async (_request, reply) => {
    try {
      const config = await loadConfig(path.join(projectDir, "eventpilot.yaml"));
      const broker = resolveBroker(config.broker.type, brokers);
      return await broker.listTopics();
    } catch (err) {
      reply.code(500);
      return { error: (err as Error).message };
    }
  });
}
