import { Kafka, logLevel } from "kafkajs";

import type { EventBus } from "./event-bus.js";

/**
 * Tails every configured topic directly from the broker and publishes each message into the
 * shared EventBus. This is the zero-instrumentation fallback: it works even for services that
 * haven't adopted @pilotevent/sdk-node yet. Once a service's SDK reports the same message
 * itself, EventBus dedupes the two (see event-bus.ts).
 */
export class LiveTail {
  private startPromise: Promise<void> | null = null;

  constructor(
    private readonly bus: EventBus,
    private readonly brokers: string[],
    private readonly topics: string[],
  ) {}

  /** Idempotent — safe to call more than once; only the first call actually starts the tail. */
  ensureStarted(): void {
    this.startPromise ??= this.start();
  }

  private async start(): Promise<void> {
    if (this.topics.length === 0) return;

    const kafka = new Kafka({
      clientId: "eventpilot-control-plane",
      brokers: this.brokers,
      logLevel: logLevel.NOTHING,
      retry: { retries: 3 },
    });
    const consumer = kafka.consumer({ groupId: `eventpilot-dashboard-${Date.now()}` });

    await consumer.connect();
    for (const topic of this.topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        this.bus.publish({
          topic,
          key: message.key?.toString() ?? null,
          value: message.value?.toString() ?? null,
          correlationId: message.headers?.["x-correlation-id"]?.toString() ?? null,
          causationId: message.headers?.["x-causation-id"]?.toString() ?? null,
          service: null,
          direction: "broker-tail",
          timestamp: new Date(Number(message.timestamp)).toISOString(),
        });
      },
    });
  }
}
