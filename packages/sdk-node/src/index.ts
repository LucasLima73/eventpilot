import type { Consumer, Producer } from "kafkajs";

import { wrapConsumer } from "./wrap-consumer.js";
import { wrapProducer } from "./wrap-producer.js";

export type { TraceEvent } from "./report.js";
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
}

export function createEventPilotAgent(options: EventPilotAgentOptions): EventPilotAgent {
  const controlPlaneUrl =
    options.controlPlaneUrl ?? process.env.EVENTPILOT_CONTROL_PLANE_URL ?? "http://localhost:4000";

  return {
    wrapProducer: (producer: Producer) =>
      wrapProducer(producer, { service: options.service, controlPlaneUrl }),
    wrapConsumer: (consumer: Consumer) =>
      wrapConsumer(consumer, { service: options.service, controlPlaneUrl }),
  };
}
