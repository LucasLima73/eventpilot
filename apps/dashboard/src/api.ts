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
