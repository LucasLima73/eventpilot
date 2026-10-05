export interface LiveEvent {
  topic: string;
  key: string | null;
  value: string | null;
  correlationId: string | null;
  causationId: string | null;
  /** Reporting service, when known via the SDK. null for broker-tail (no attribution). */
  service: string | null;
  direction: "produce" | "consume" | "broker-tail" | "error";
  timestamp: string;
  /** Only set when direction is "error". */
  error?: string;
}

const HISTORY_LIMIT = 50;
const DEDUP_WINDOW_MS = 3000;

/**
 * Shared fan-out point for every event source: LiveTail's own broker read, and the SDK's
 * POST /api/traces push. Both can report the *same* physical message landing on a topic —
 * LiveTail sees it by tailing the topic, the SDK sees it from the producer's own `send()` —
 * so "produce" and "broker-tail" reports are deduped against each other by topic +
 * correlationId within a short window. "consume" reports are never deduped against
 * anything: each represents a distinct service actually receiving the message, and a topic
 * can have several consumers.
 */
export class EventBus {
  private readonly listeners = new Set<(event: LiveEvent) => void>();
  private readonly history: LiveEvent[] = [];
  private readonly recentOrigins = new Map<string, number>();

  subscribe(listener: (event: LiveEvent) => void): () => void {
    for (const event of this.history) listener(event);
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: LiveEvent): void {
    const dedupable = event.direction === "produce" || event.direction === "broker-tail";
    if (dedupable && event.correlationId) {
      const now = Date.now();
      this.pruneExpired(now);

      const signature = `${event.topic}|${event.correlationId}`;
      if (this.recentOrigins.has(signature)) return;
      this.recentOrigins.set(signature, now + DEDUP_WINDOW_MS);
    }

    this.history.push(event);
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
    for (const listener of this.listeners) listener(event);
  }

  private pruneExpired(now: number): void {
    for (const [signature, expiry] of this.recentOrigins) {
      if (expiry <= now) this.recentOrigins.delete(signature);
    }
  }
}
