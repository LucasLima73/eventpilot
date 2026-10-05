import type {
  Consumer,
  ConsumerRunConfig,
  ConsumerSubscribeTopic,
  ConsumerSubscribeTopics,
} from "kafkajs";

import { reportTrace } from "./report.js";

export interface WrapConsumerOptions {
  service: string;
  controlPlaneUrl: string;
}

export interface WrappedConsumer {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(subscription: ConsumerSubscribeTopics | ConsumerSubscribeTopic): Promise<void>;
  run(config?: ConsumerRunConfig): Promise<void>;
}

function headerValue(value: Buffer | string | (Buffer | string)[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0]?.toString() : value.toString();
}

/**
 * Wraps only the kafkajs Consumer methods this repo's generated code actually calls — not a
 * full proxy of the kafkajs API. Reports a consume trace (topic + whatever correlation/
 * causation ids the message already carries) before delegating to the caller's own
 * eachMessage handler.
 */
export function wrapConsumer(consumer: Consumer, options: WrapConsumerOptions): WrappedConsumer {
  return {
    connect: () => consumer.connect(),
    disconnect: () => consumer.disconnect(),
    subscribe: (subscription) => consumer.subscribe(subscription),

    async run(config?: ConsumerRunConfig): Promise<void> {
      const eachMessage = config?.eachMessage;

      return consumer.run({
        ...config,
        eachMessage: eachMessage
          ? async (payload) => {
              const correlationId =
                headerValue(payload.message.headers?.["x-correlation-id"]) ?? null;
              const causationId = headerValue(payload.message.headers?.["x-causation-id"]) ?? null;

              void reportTrace(options.controlPlaneUrl, {
                service: options.service,
                direction: "consume",
                topic: payload.topic,
                correlationId,
                causationId,
                timestamp: new Date().toISOString(),
              });

              try {
                await eachMessage(payload);
              } catch (err) {
                void reportTrace(options.controlPlaneUrl, {
                  service: options.service,
                  direction: "error",
                  topic: payload.topic,
                  correlationId,
                  causationId,
                  timestamp: new Date().toISOString(),
                  error: (err as Error).message ?? String(err),
                });
                throw err;
              }
            }
          : undefined,
      });
    },
  };
}
