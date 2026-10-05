# Getting started

```bash
npx eventpilot init
```

Answer the wizard's questions (project name, service name, language, events it
produces/consumes, contract format). You'll get three things in the current directory:

- `eventpilot.yaml` — the source of truth for your project.
- `docker-compose.yml` — Redpanda (+ Postgres, if you enable the Outbox feature).
- `services/<name>/` — a producer/consumer for the language you picked.

Then:

```bash
eventpilot doctor    # checks Node + Docker are ready
eventpilot up         # starts the broker
eventpilot dashboard  # opens the local control plane + web UI
```

Run your generated service (`npm run dev` for Node, `gradle run` for Java) and watch
events show up live in the dashboard's graph.

## Adding features to an existing project

```bash
eventpilot add dlq      # retry-with-backoff + dead-letter queue
eventpilot add outbox   # transactional outbox pattern (needs Postgres)
```

Both re-run `eventpilot generate` under the hood, so edit `eventpilot.yaml` and run
`eventpilot generate` any time you add a topic or service by hand instead.

## Inspecting a topic

```bash
eventpilot replay <topic> --limit 20   # print recent events as JSON
eventpilot metrics <topic>             # throughput, consumer lag, DLQ count, errors
```

Both are also available per-topic in the dashboard (Topic inspector panel).

## Validating contracts

If a topic declares `schema: ./contracts/<file>` in `eventpilot.yaml`, `eventpilot
validate` checks that file against `contracts.format` (AsyncAPI or JSON Schema) — not
just that `eventpilot.yaml` itself is well-formed. Good to run in CI.

## Worked examples

- [`examples/orders-node`](../examples/orders-node) — Node/TypeScript, every feature on.
- [`examples/orders-java`](../examples/orders-java) — Java, every feature on.

## Where to go next

- [`README.md`](../README.md) — project overview, status, full command reference.
- [`CLAUDE.md`](../CLAUDE.md) — architecture, roadmap, and the reasoning behind design
  decisions (written for AI assistants working on this repo, but equally useful for
  humans who want the full picture).
