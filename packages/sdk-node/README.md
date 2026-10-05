# @pilotevent/sdk-node

Lightweight Node agent for EventPilot. Wraps your own kafkajs `Producer`/`Consumer`
instances so that:

- every produced message carries an `x-correlation-id` header (generated if you didn't
  set one) and keeps whatever `x-causation-id` you passed;
- every produce/consume is reported as a trace to the control plane
  (`POST /api/traces`), which is what drives the live event graph in the dashboard.

```ts
import { Kafka } from "kafkajs";
import { createEventPilotAgent } from "@pilotevent/sdk-node";

const kafka = new Kafka({ brokers: ["localhost:19092"] });
const agent = createEventPilotAgent({ service: "order-service" });

const producer = agent.wrapProducer(kafka.producer());
const consumer = agent.wrapConsumer(kafka.consumer({ groupId: "order-service" }));
```

`controlPlaneUrl` defaults to `EVENTPILOT_CONTROL_PLANE_URL`, then `http://localhost:4000`
(where `eventpilot dashboard` serves the control plane locally) — set the env var to point
at a different instance.

## Scope

This wraps only the handful of kafkajs `Producer`/`Consumer` methods EventPilot's own
generated code calls (`send`, `run`, `connect`, `disconnect`, `subscribe`) — it is **not**
a full proxy of the kafkajs API. No message payload (`key`/`value`) is ever sent to the
control plane, only metadata (service, topic, direction, correlation/causation ids,
timestamp): the agent stays "leve" and never ships your event bodies over HTTP by default.

Telemetry failures (control plane unreachable, down, etc.) are always swallowed — a
produce/consume call must never fail because of this.

Works the same way whether you're using EventPilot-generated code (greenfield) or wiring
this into an existing service (brownfield) — see CLAUDE.md section 4.
