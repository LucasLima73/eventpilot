import { randomUUID } from "node:crypto";

import type { Producer, ProducerRecord, RecordMetadata } from "kafkajs";

import { reportTrace } from "./report.js";

export interface WrapProducerOptions {
  service: string;
  controlPlaneUrl: string;
}

export interface WrappedProducer {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(record: ProducerRecord): Promise<RecordMetadata[]>;
}

function headerValue(value: Buffer | string | (Buffer | string)[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0]?.toString() : value.toString();
}

/**
 * Wraps only the kafkajs Producer methods this repo's generated code actually calls — not a
 * full proxy of the kafkajs API. Ensures every message carries an `x-correlation-id` (one is
 * generated if the caller didn't set one) and reports a produce trace to the control plane
 * before delegating to the real producer.
 */
export function wrapProducer(producer: Producer, options: WrapProducerOptions): WrappedProducer {
  return {
    connect: () => producer.connect(),
    disconnect: () => producer.disconnect(),

    async send(record: ProducerRecord): Promise<RecordMetadata[]> {
      const timestamp = new Date().toISOString();

      const messages = record.messages.map((message) => {
        const correlationId = headerValue(message.headers?.["x-correlation-id"]) ?? randomUUID();
        const causationId = headerValue(message.headers?.["x-causation-id"]) ?? null;

        void reportTrace(options.controlPlaneUrl, {
          service: options.service,
          direction: "produce",
          topic: record.topic,
          correlationId,
          causationId,
          timestamp,
        });

        return {
          ...message,
          headers: {
            ...message.headers,
            "x-correlation-id": correlationId,
            ...(causationId ? { "x-causation-id": causationId } : {}),
          },
        };
      });

      return producer.send({ ...record, messages });
    },
  };
}
