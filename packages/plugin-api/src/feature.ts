import type { ZodTypeAny } from "zod";

import type { GeneratedFile, ServiceSpec } from "./generator.js";

export interface FeatureContext {
  projectName: string;
  services: ServiceSpec[];
  config: unknown;
  outputDir: string;
}

/** A plugin that adds a cross-cutting capability (dlq, outbox, replay, ...). */
export interface FeatureModule {
  id: string; // "dlq" | "outbox" | "metrics" | "replay" | ...
  configSchema: ZodTypeAny;
  apply(ctx: FeatureContext): Promise<GeneratedFile[]>;
}
