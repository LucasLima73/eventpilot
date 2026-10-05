import type { EventBus } from "./event-bus.js";

/**
 * Tracks how many "error" traces each topic has reported since this process started. This is
 * the only source of `errorCount` for metrics — the broker itself has no notion of
 * application-level errors (see @pilotevent/broker-redpanda's getMetrics).
 */
export class ErrorCounts {
  private readonly counts = new Map<string, number>();

  constructor(bus: EventBus) {
    bus.subscribe((event) => {
      if (event.direction !== "error") return;
      this.counts.set(event.topic, (this.counts.get(event.topic) ?? 0) + 1);
    });
  }

  get(topic: string): number {
    return this.counts.get(topic) ?? 0;
  }
}
