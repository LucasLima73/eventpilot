import type { BrokerAdapter } from "@eventpilot/plugin-api";

export interface TopicToProvision {
  name: string;
  partitions: number;
  retention: string;
  dlq: boolean;
}

/**
 * Creates every declared topic on the broker (idempotent — kafkajs doesn't
 * throw when a topic already exists), plus a `<name>.dlq` topic for any
 * topic with `dlq: true`. Without this, topics only existed via Redpanda's
 * dev-container auto-create, silently ignoring partitions/retention/dlq from
 * eventpilot.yaml.
 */
export async function provisionTopics(
  broker: BrokerAdapter,
  topics: TopicToProvision[],
): Promise<string[]> {
  const created: string[] = [];
  for (const topic of topics) {
    await broker.createTopic({
      name: topic.name,
      partitions: topic.partitions,
      retention: topic.retention,
    });
    created.push(topic.name);

    if (topic.dlq) {
      const dlqName = `${topic.name}.dlq`;
      await broker.createTopic({
        name: dlqName,
        partitions: topic.partitions,
        retention: topic.retention,
      });
      created.push(dlqName);
    }
  }
  return created;
}

/** Polls the broker until it responds or the attempts run out. */
export async function waitForBroker(
  broker: BrokerAdapter,
  { attempts = 15, delayMs = 2000 }: { attempts?: number; delayMs?: number } = {},
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await broker.listTopics();
      return;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(
    `Broker never became reachable after ${attempts} attempts: ${(lastError as Error).message}`,
  );
}
