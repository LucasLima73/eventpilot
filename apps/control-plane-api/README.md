# @eventpilot/control-plane-api

Fastify server that backs the dashboard: serves the parsed `eventpilot.yaml`, live
topic metadata from the broker, and a WebSocket feed of events as they happen.

Routes:

- `GET /api/config` — parsed `eventpilot.yaml` from `--project` (default: cwd).
- `GET /api/topics` — live topic list from the broker (via `@eventpilot/broker-redpanda`).
- `GET /ws/events` — WebSocket; streams each event as JSON as it's produced.

## Running

```bash
pnpm --filter @eventpilot/control-plane-api dev -- --project /path/to/your/project --port 4000
```

`--project` must point at a directory with an `eventpilot.yaml` (created by `eventpilot init`),
and the broker in that config must already be reachable (`eventpilot up` first).

## Note on the live event feed

This tails the broker's topics directly with `kafkajs`. CLAUDE.md's architecture
(section 4) describes a different, more complete design: a lightweight SDK/agent
embedded in the user's services that pushes traces (with `correlation_id`/`causation_id`)
to the control plane over API/WebSocket. That SDK doesn't exist yet — this is an
interim simplification so the dashboard has something real to show.
