import path from "node:path";

import { loadConfig } from "@eventpilot/core";
import type { FastifyInstance } from "fastify";

export function registerConfigRoute(app: FastifyInstance, projectDir: string): void {
  app.get("/api/config", async (_request, reply) => {
    try {
      const config = await loadConfig(path.join(projectDir, "eventpilot.yaml"));
      return config;
    } catch (err) {
      reply.code(500);
      return { error: (err as Error).message };
    }
  });
}
