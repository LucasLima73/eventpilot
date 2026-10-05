import { Kafka, logLevel } from "kafkajs";
import type {
  BrokerAdapter,
  BrokerConfig,
  ComposeFragment,
  EventRecord,
  Range,
  TopicConfig,
  TopicInfo,
  TopicMetrics,
} from "@pilotevent/plugin-api";

import { composeService } from "./compose.js";
import { getMetrics } from "./metrics.js";
import { readRange } from "./read-range.js";
import { retentionToMs } from "./retention.js";

export interface RedpandaAdapterOptions {
  brokers: string[];
  clientId?: string;
}

export function createRedpandaAdapter(options: RedpandaAdapterOptions): BrokerAdapter {
  const kafka = new Kafka({
    clientId: options.clientId ?? "eventpilot",
    brokers: options.brokers,
    logLevel: logLevel.NOTHING,
  });

  return {
    id: "redpanda",

    composeService(cfg: BrokerConfig): ComposeFragment {
      return composeService(cfg);
    },

    async createTopic(t: TopicConfig): Promise<void> {
      const admin = kafka.admin();
      await admin.connect();
      try {
        await admin.createTopics({
          waitForLeaders: true,
          topics: [
            {
              topic: t.name,
              numPartitions: t.partitions,
              configEntries: [{ name: "retention.ms", value: String(retentionToMs(t.retention)) }],
            },
          ],
        });
      } finally {
        await admin.disconnect();
      }
    },

    async listTopics(): Promise<TopicInfo[]> {
      const admin = kafka.admin();
      await admin.connect();
      try {
        const names = (await admin.listTopics()).filter((name) => !name.startsWith("__"));
        if (names.length === 0) return [];
        const { topics } = await admin.fetchTopicMetadata({ topics: names });
        return topics.map((topic) => ({
          name: topic.name,
          partitions: topic.partitions.length,
          replicas: topic.partitions[0]?.replicas.length ?? 0,
        }));
      } finally {
        await admin.disconnect();
      }
    },

    async getMetrics(topic: string): Promise<TopicMetrics> {
      return getMetrics(kafka, topic);
    },

    readRange(topic: string, range: Range): AsyncIterable<EventRecord> {
      return readRange(kafka, topic, range);
    },

    async publish(topic: string, e: EventRecord): Promise<void> {
      const producer = kafka.producer();
      await producer.connect();
      try {
        await producer.send({
          topic,
          messages: [
            {
              key: e.key,
              value: e.value,
              headers: {
                ...e.headers,
                ...(e.correlationId ? { "x-correlation-id": e.correlationId } : {}),
                ...(e.causationId ? { "x-causation-id": e.causationId } : {}),
              },
            },
          ],
        });
      } finally {
        await producer.disconnect();
      }
    },
  };
}
