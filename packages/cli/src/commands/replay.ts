import { loadConfig } from "@pilotevent/core";
import type { Range } from "@pilotevent/plugin-api";

import { resolveBroker } from "../brokers.js";

export interface ReplayOptions {
  from?: string;
  to?: string;
  limit?: string;
}

export async function replay(topic: string, options: ReplayOptions): Promise<void> {
  const config = await loadConfig("eventpilot.yaml");
  const broker = resolveBroker(config.broker.type);

  const range: Range = {};
  if (options.from !== undefined) range.fromOffset = BigInt(options.from);
  if (options.to !== undefined) range.toOffset = BigInt(options.to);
  const limit = options.limit !== undefined ? Number(options.limit) : undefined;

  let count = 0;
  for await (const event of broker.readRange(topic, range)) {
    console.log(
      JSON.stringify({
        key: event.key ?? null,
        value: event.value.toString(),
        correlationId: event.correlationId ?? null,
        causationId: event.causationId ?? null,
      }),
    );
    count += 1;
    if (limit !== undefined && count >= limit) break;
  }

  console.log(`\n✔ replayed ${count} event(s) from ${topic}`);
}
