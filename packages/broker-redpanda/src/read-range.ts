import type { Kafka } from "kafkajs";
import type { EventRecord, Range } from "@pilotevent/plugin-api";

import { AsyncQueue } from "./async-queue.js";

function toEventRecord(
  topic: string,
  message: {
    key: Buffer | null;
    value: Buffer | null;
    headers?: Record<string, Buffer | string | (Buffer | string)[] | undefined>;
  },
): EventRecord {
  const headers = Object.fromEntries(
    Object.entries(message.headers ?? {}).map(([k, v]) => [k, v?.toString() ?? ""]),
  );
  return {
    topic,
    key: message.key?.toString(),
    value: message.value ?? Buffer.alloc(0),
    headers,
    correlationId: headers["x-correlation-id"],
    causationId: headers["x-causation-id"],
  };
}

/**
 * Replays a topic's messages for a given range. With no range at all, replays
 * everything currently on the topic (a snapshot at call time — it does not
 * then switch into a live tail). Partitions are read in parallel; ordering
 * across partitions isn't guaranteed, only within each one.
 */
export async function* readRange(
  kafka: Kafka,
  topic: string,
  range: Range,
): AsyncGenerator<EventRecord> {
  const admin = kafka.admin();
  await admin.connect();

  let partitionIds: number[];
  let endOffsets: Map<number, bigint>;
  try {
    const { topics } = await admin.fetchTopicMetadata({ topics: [topic] });
    partitionIds = topics[0]?.partitions.map((p) => p.partitionId) ?? [];

    if (range.toOffset !== undefined) {
      endOffsets = new Map(partitionIds.map((p) => [p, range.toOffset as bigint]));
    } else if (range.toTimestamp !== undefined) {
      const offsets = await admin.fetchTopicOffsetsByTimestamp(topic, range.toTimestamp.getTime());
      endOffsets = new Map(offsets.map((o) => [o.partition, BigInt(o.offset) - 1n]));
    } else {
      // No upper bound given: snapshot the current high watermark so this
      // call returns once it catches up, instead of tailing forever.
      const offsets = await admin.fetchTopicOffsets(topic);
      endOffsets = new Map(offsets.map((o) => [o.partition, BigInt(o.high) - 1n]));
    }
  } finally {
    await admin.disconnect();
  }

  if (partitionIds.length === 0) return;

  const queue = new AsyncQueue<EventRecord>();
  const donePartitions = new Set<number>();

  function markDone(partition: number): void {
    donePartitions.add(partition);
    if (donePartitions.size === partitionIds.length) queue.close();
  }

  // Nothing to read on this partition at all (e.g. empty topic) — eachMessage
  // will never fire for it, so it would never be marked done otherwise.
  for (const partition of partitionIds) {
    if ((endOffsets.get(partition) ?? -1n) < 0n && range.fromOffset === undefined) {
      markDone(partition);
    }
  }
  if (donePartitions.size === partitionIds.length) return;

  const consumer = kafka.consumer({
    groupId: `eventpilot-replay-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  const runPromise = consumer.run({
    eachMessage: async ({ partition, message }) => {
      if (donePartitions.has(partition)) return;
      const offset = BigInt(message.offset);
      const end = endOffsets.get(partition);

      if (range.fromOffset !== undefined && offset < range.fromOffset) return;

      if (end !== undefined && offset > end) {
        markDone(partition);
        return;
      }

      queue.push(toEventRecord(topic, message));

      if (end !== undefined && offset >= end) markDone(partition);
    },
  });

  if (range.fromOffset !== undefined || range.fromTimestamp !== undefined) {
    await new Promise<void>((resolve) => {
      consumer.on(consumer.events.GROUP_JOIN, () => resolve());
    });

    if (range.fromOffset !== undefined) {
      for (const partition of partitionIds) {
        consumer.seek({ topic, partition, offset: range.fromOffset.toString() });
      }
    } else if (range.fromTimestamp !== undefined) {
      const seekAdmin = kafka.admin();
      await seekAdmin.connect();
      try {
        const offsets = await seekAdmin.fetchTopicOffsetsByTimestamp(
          topic,
          range.fromTimestamp.getTime(),
        );
        for (const o of offsets) consumer.seek({ topic, partition: o.partition, offset: o.offset });
      } finally {
        await seekAdmin.disconnect();
      }
    }
  }

  try {
    for await (const event of queue) {
      yield event;
    }
  } finally {
    await consumer.disconnect().catch(() => undefined);
    await runPromise.catch(() => undefined);
  }
}
