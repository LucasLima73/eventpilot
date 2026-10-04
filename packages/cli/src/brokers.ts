import { createRedpandaAdapter } from "@eventpilot/broker-redpanda";
import type { BrokerAdapter } from "@eventpilot/plugin-api";

export function resolveBroker(type: string): BrokerAdapter {
  if (type !== "redpanda") {
    throw new Error(
      `No broker adapter for "${type}". Available: redpanda.\n` +
        "Other brokers (Kafka, RabbitMQ, NATS) are planned but not implemented yet.",
    );
  }
  return createRedpandaAdapter({ brokers: ["localhost:9092"] });
}
