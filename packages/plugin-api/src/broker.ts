export interface BrokerConfig {
  type: string;
  version: string;
  [option: string]: unknown;
}

/** A fragment to be merged into the generated docker-compose file. */
export interface ComposeFragment {
  services: Record<string, unknown>;
  volumes?: Record<string, unknown>;
}

export interface TopicConfig {
  name: string;
  partitions: number;
  retention: string;
  schema?: string;
  dlq?: boolean;
}

export interface TopicInfo {
  name: string;
  partitions: number;
  replicas: number;
}

export interface TopicMetrics {
  topic: string;
  throughputPerSec: number;
  consumerLag: number;
  errorCount: number;
  dlqCount: number;
}

export interface Range {
  fromOffset?: bigint;
  toOffset?: bigint;
  fromTimestamp?: Date;
  toTimestamp?: Date;
}

export interface EventRecord {
  topic: string;
  key?: string;
  value: Buffer | string;
  headers?: Record<string, string>;
  correlationId?: string;
  causationId?: string;
}

/**
 * Common interface every broker plugin must implement. The core never talks
 * to Redpanda/Kafka/RabbitMQ/NATS directly — only through this contract.
 */
export interface BrokerAdapter {
  id: string;
  composeService(cfg: BrokerConfig): ComposeFragment;
  createTopic(t: TopicConfig): Promise<void>;
  listTopics(): Promise<TopicInfo[]>;
  getMetrics(topic: string): Promise<TopicMetrics>;
  readRange(topic: string, range: Range): AsyncIterable<EventRecord>;
  publish(topic: string, e: EventRecord): Promise<void>;
}
