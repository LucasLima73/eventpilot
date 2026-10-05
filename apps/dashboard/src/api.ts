export interface ServiceConfig {
  name: string;
  language: string;
  produces: string[];
  consumes: string[];
}

export interface TopicDefinition {
  name: string;
  partitions: number;
  retention: string;
  dlq: boolean;
  schema?: string;
}

export interface EventPilotConfig {
  project: { name: string };
  broker: { type: string; version: string };
  services: ServiceConfig[];
  topics: TopicDefinition[];
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

export interface ReplayedEvent {
  key: string | null;
  value: string;
  correlationId: string | null;
  causationId: string | null;
}

export async function fetchConfig(): Promise<EventPilotConfig> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error(`GET /api/config failed: ${res.status}`);
  return res.json();
}

export async function fetchTopics(): Promise<TopicInfo[]> {
  const res = await fetch("/api/topics");
  if (!res.ok) throw new Error(`GET /api/topics failed: ${res.status}`);
  return res.json();
}

export async function fetchMetrics(topic: string): Promise<TopicMetrics> {
  const res = await fetch(`/api/metrics?topic=${encodeURIComponent(topic)}`);
  if (!res.ok) throw new Error(`GET /api/metrics failed: ${res.status}`);
  return res.json();
}

export async function fetchReplay(
  topic: string,
  options: { from?: string; to?: string; limit?: number } = {},
): Promise<ReplayedEvent[]> {
  const params = new URLSearchParams({ topic });
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  if (options.limit) params.set("limit", String(options.limit));

  const res = await fetch(`/api/replay?${params.toString()}`);
  if (!res.ok) throw new Error(`GET /api/replay failed: ${res.status}`);
  return res.json();
}
