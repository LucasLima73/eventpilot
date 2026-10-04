#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseArgs } from "./cli-args.js";
import { createServer } from "./server.js";

const args = parseArgs(process.argv.slice(2));

const builtDashboardDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../dashboard/dist",
);

const server = await createServer({
  projectDir: args.projectDir,
  brokers: args.brokers,
  dashboardDistDir: existsSync(builtDashboardDir) ? builtDashboardDir : undefined,
});

await server.listen({ port: args.port, host: "0.0.0.0" });
