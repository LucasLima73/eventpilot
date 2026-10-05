# @pilotevent/control-plane-api

Fastify server that backs the dashboard: serves the parsed `eventpilot.yaml`, live
topic metadata from the broker, and a WebSocket feed of events as they happen.

Routes:

- `GET /api/config` — parsed `eventpilot.yaml` from `--project` (default: cwd).
- `GET /api/topics` — live topic list from the broker (via `@pilotevent/broker-redpanda`).
- `POST /api/traces` — ingests a trace event pushed by a `@pilotevent/sdk-node` agent.
- `GET /ws/events` — WebSocket; streams each event as JSON as it's produced.

## Running

```bash
pnpm --filter @pilotevent/control-plane-api dev -- --project /path/to/your/project --port 4000
```

`--project` must point at a directory with an `eventpilot.yaml` (created by `eventpilot init`),
and the broker in that config must already be reachable (`eventpilot up` first).

## Note on the live event feed

Events reach the dashboard's `/ws/events` feed from two sources, merged by `EventBus`
(`src/event-bus.ts`):

1. **`LiveTail`** (`src/live-tail.ts`) tails the broker's topics directly with `kafkajs`.
   Zero-instrumentation fallback — works even for services that haven't adopted the SDK.
2. **`POST /api/traces`**, pushed by a `@pilotevent/sdk-node` agent embedded in a service
   (see CLAUDE.md section 4). Carries `service` and `direction` (`produce`/`consume`),
   which `LiveTail` can't know on its own.

When a service uses the SDK, both sources see the same produced message once each;
`EventBus` dedupes a `broker-tail` report against an SDK `produce` report for the same
topic + `correlationId` within a short window. `consume` reports are never deduped — each
represents a distinct service actually receiving the message.
