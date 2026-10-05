import type { Consumer, Producer } from "kafkajs";

import { reportTrace } from "./report.js";
import { wrapConsumer } from "./wrap-consumer.js";
import { wrapProducer } from "./wrap-producer.js";

export type { TraceEvent } from "./report.js";
export { reportTrace } from "./report.js";
export type { WrappedConsumer } from "./wrap-consumer.js";
export type { WrappedProducer } from "./wrap-producer.js";

export interface EventPilotAgentOptions {
  /** Name of the service this agent is embedded in, as it'll show up in the dashboard. */
  service: string;
  /** Defaults to EVENTPILOT_CONTROL_PLANE_URL, then http://localhost:4000. */
  controlPlaneUrl?: string;
}

export interface EventPilotAgent {
  wrapProducer(producer: Producer): ReturnType<typeof wrapProducer>;
  wrapConsumer(consumer: Consumer): ReturnType<typeof wrapConsumer>;
  /** Reports an error trace directly — for errors a wrapper already swallowed (e.g. feature-dlq, after retries). */
  reportError(topic: string, correlationId: string | null, error: unknown): void;
}

export function createEventPilotAgent(options: EventPilotAgentOptions): EventPilotAgent {
  const controlPlaneUrl =
    options.controlPlaneUrl ?? process.env.EVENTPILOT_CONTROL_PLANE_URL ?? "http://localhost:4000";

  return {
    wrapProducer: (producer: Producer) =>
      wrapProducer(producer, { service: options.service, controlPlaneUrl }),
    wrapConsumer: (consumer: Consumer) =>
      wrapConsumer(consumer, { service: options.service, controlPlaneUrl }),
    reportError: (topic: string, correlationId: string | null, error: unknown) => {
      void reportTrace(controlPlaneUrl, {
        service: options.service,
        direction: "error",
        topic,
        correlationId,
        causationId: null,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    },
  };
}
