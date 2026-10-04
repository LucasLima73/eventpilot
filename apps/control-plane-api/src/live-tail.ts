import { Kafka, logLevel } from "kafkajs";

export interface LiveEvent {
  topic: string;
  key: string | null;
  value: string | null;
  correlationId: string | null;
  causationId: string | null;
  timestamp: string;
}

/**
 * Tails every configured topic directly from the broker and fans out each
 * message to subscribed WebSocket clients. This is an interim stand-in for
 * the SDK-push telemetry pipeline described in CLAUDE.md section 4 (the
 * agent/SDK is meant to report traces to the control plane) — that pipeline
 * isn't built yet, so this reads the wire directly instead.
 */
const HISTORY_LIMIT = 50;

export class LiveTail {
  private readonly listeners = new Set<(event: LiveEvent) => void>();
  private readonly history: LiveEvent[] = [];
  private startPromise: Promise<void> | null = null;

  constructor(
    private readonly brokers: string[],
    private readonly topics: string[],
  ) {}

  /** Registers a listener, immediately replaying recent events so a reconnect isn't blank. */
  subscribe(listener: (event: LiveEvent) => void): () => void {
    for (const event of this.history) listener(event);
    this.listeners.add(listener);
    this.startPromise ??= this.start();
    return () => this.listeners.delete(listener);
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
        const event: LiveEvent = {
          topic,
          key: message.key?.toString() ?? null,
          value: message.value?.toString() ?? null,
          correlationId: message.headers?.["x-correlation-id"]?.toString() ?? null,
          causationId: message.headers?.["x-causation-id"]?.toString() ?? null,
          timestamp: new Date(Number(message.timestamp)).toISOString(),
        };
        this.history.push(event);
        if (this.history.length > HISTORY_LIMIT) this.history.shift();
        for (const listener of this.listeners) listener(event);
      },
    });
  }
}
