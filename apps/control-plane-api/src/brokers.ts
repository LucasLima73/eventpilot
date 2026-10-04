import { createRedpandaAdapter } from "@eventpilot/broker-redpanda";
import type { BrokerAdapter } from "@eventpilot/plugin-api";

export function resolveBroker(type: string, brokers: string[]): BrokerAdapter {
  if (type !== "redpanda") {
    throw new Error(`No broker adapter for "${type}". Available: redpanda.`);
  }
  return createRedpandaAdapter({ brokers });
}
