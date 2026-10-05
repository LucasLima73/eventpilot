#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseArgs } from "./cli-args.js";
import { createServer } from "./server.js";

const args = parseArgs(process.argv.slice(2));

// dist/bin.js -> dist/public, bundled into this package's own build (not a
// monorepo-relative path), so this also works when installed as a plain npm
// dependency with no sibling apps/dashboard around.
const builtDashboardDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

const server = await createServer({
  projectDir: args.projectDir,
  brokers: args.brokers,
  dashboardDistDir: existsSync(builtDashboardDir) ? builtDashboardDir : undefined,
});

await server.listen({ port: args.port, host: "0.0.0.0" });
console.log(`\nDashboard: http://localhost:${args.port}\n`);
