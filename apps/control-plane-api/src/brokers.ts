import { createRedpandaAdapter } from "@pilotevent/broker-redpanda";
import type { BrokerAdapter } from "@pilotevent/plugin-api";

export function resolveBroker(type: string, brokers: string[]): BrokerAdapter {
  if (type !== "redpanda") {
    throw new Error(`No broker adapter for "${type}". Available: redpanda.`);
  }
  return createRedpandaAdapter({ brokers });
}
