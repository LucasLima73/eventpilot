import path from "node:path";

import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import websocket from "@fastify/websocket";
import { loadConfig } from "@pilotevent/core";
import Fastify, { type FastifyInstance } from "fastify";

import { EventBus } from "./event-bus.js";
import { LiveTail } from "./live-tail.js";
import { registerConfigRoute } from "./routes/config.js";
import { registerEventsWebSocket } from "./routes/events-ws.js";
import { registerTopicsRoute } from "./routes/topics.js";
import { registerTracesRoute } from "./routes/traces.js";
import { uniqueTopics } from "./topics.js";

export interface CreateServerOptions {
  projectDir: string;
  brokers: string[];
  /** Directory with the built dashboard (apps/dashboard/dist), served as static assets if present. */
  dashboardDistDir?: string;
}

export async function createServer(options: CreateServerOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  if (options.dashboardDistDir) {
    await app.register(fastifyStatic, {
      root: options.dashboardDistDir,
    });
  }

  const config = await loadConfig(path.join(options.projectDir, "eventpilot.yaml"));
  const bus = new EventBus();
  const liveTail = new LiveTail(bus, options.brokers, uniqueTopics(config.services));
  liveTail.ensureStarted();

  registerConfigRoute(app, options.projectDir);
  registerTopicsRoute(app, options.projectDir, options.brokers);
  registerTracesRoute(app, bus);
  registerEventsWebSocket(app, bus);

  return app;
}
