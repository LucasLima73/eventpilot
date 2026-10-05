import type { Kafka } from "kafkajs";
import type { TopicMetrics } from "@pilotevent/plugin-api";

async function totalMessageCount(kafka: Kafka, topic: string): Promise<number> {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const offsets = await admin.fetchTopicOffsets(topic);
    return offsets.reduce((sum, o) => sum + Number(o.high), 0);
  } catch {
    return 0; // topic doesn't exist yet (e.g. no .dlq topic has been created)
  } finally {
    await admin.disconnect();
  }
}

/** Real instantaneous rate: samples the total message count twice, a window apart. */
async function measureThroughput(kafka: Kafka, topic: string, windowMs = 1000): Promise<number> {
  const before = await totalMessageCount(kafka, topic);
  await new Promise((resolve) => setTimeout(resolve, windowMs));
  const after = await totalMessageCount(kafka, topic);
  return Math.max(0, (after - before) / (windowMs / 1000));
}

/** Summed lag across every consumer group that has committed offsets for this topic. */
async function measureConsumerLag(kafka: Kafka, topic: string): Promise<number> {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const highWatermarks = await admin.fetchTopicOffsets(topic);
    const highByPartition = new Map(highWatermarks.map((o) => [o.partition, BigInt(o.high)]));

    const { groups } = await admin.listGroups();
    let totalLag = 0n;

    for (const group of groups) {
      let topicOffsets;
      try {
        topicOffsets = await admin.fetchOffsets({ groupId: group.groupId, topics: [topic] });
      } catch {
        continue;
      }
      for (const entry of topicOffsets) {
        for (const partitionOffset of entry.partitions) {
          if (partitionOffset.offset === "-1") continue; // group never committed on this partition
          const high = highByPartition.get(partitionOffset.partition) ?? 0n;
          const lag = high - BigInt(partitionOffset.offset);
          if (lag > 0n) totalLag += lag;
        }
      }
    }

    return Number(totalLag);
  } finally {
    await admin.disconnect();
  }
}

export async function getMetrics(kafka: Kafka, topic: string): Promise<TopicMetrics> {
  const [throughputPerSec, consumerLag, dlqCount] = await Promise.all([
    measureThroughput(kafka, topic),
    measureConsumerLag(kafka, topic),
    totalMessageCount(kafka, `${topic}.dlq`),
  ]);

  return {
    topic,
    throughputPerSec,
    consumerLag,
    // The broker has no notion of application-level processing errors — that
    // only exists once a message ends up on the DLQ. Real error counts need
    // the SDK's error reporting (not built yet); always 0 here, not omitted,
    // so callers aren't misled into thinking it's actually being tracked.
    errorCount: 0,
    dlqCount,
  };
}
