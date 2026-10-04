import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { registerConfigRoute } from "../src/routes/config.js";

let projectDir: string;

beforeEach(async () => {
  projectDir = await mkdtemp(path.join(tmpdir(), "eventpilot-control-plane-test-"));
});

afterEach(async () => {
  await rm(projectDir, { recursive: true, force: true });
});

describe("GET /api/config", () => {
  it("returns the parsed eventpilot.yaml", async () => {
    await writeFile(
      path.join(projectDir, "eventpilot.yaml"),
      `
version: 1
project:
  name: orders-platform
broker:
  type: redpanda
  version: latest
contracts:
  format: asyncapi
  path: ./contracts
services:
  - name: order-service
    language: node-ts
    produces: [order.created]
    consumes: []
`,
      "utf-8",
    );

    const app = Fastify();
    registerConfigRoute(app, projectDir);

    const response = await app.inject({ method: "GET", url: "/api/config" });

    expect(response.statusCode).toBe(200);
    expect(response.json().project.name).toBe("orders-platform");
  });

  it("returns a 500 with a readable error when eventpilot.yaml is missing", async () => {
    const app = Fastify();
    registerConfigRoute(app, projectDir);

    const response = await app.inject({ method: "GET", url: "/api/config" });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toMatch(/eventpilot init/);
  });
});
