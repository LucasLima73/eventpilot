# EventPilot

[![npm version](https://img.shields.io/npm/v/eventpilot.svg)](https://www.npmjs.com/package/eventpilot)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

CLI + open source platform for event-driven architecture — **no paid tier, ever** (see
[`CLAUDE.md`](./CLAUDE.md), section 12). One command picks your language, broker,
contracts and features, then EventPilot generates the local infra (Docker), the base
service code, and a dashboard to configure topics/schemas/consumers, watch events flow
live, and track metrics.

> New to the project? Read [`docs/getting-started.md`](./docs/getting-started.md) for a
> full walkthrough, or keep going below for the short version.

## Install

No install needed — just run it:

```bash
npx eventpilot init
```

Or install it so the `eventpilot` command is always available:

```bash
npm install -g eventpilot
eventpilot init
```

Requires **Node 20+** and **Docker**. Run `eventpilot doctor` any time to check both.

## Quickstart

```bash
eventpilot doctor      # checks Node + Docker are ready
eventpilot init         # wizard: project name, service, language, events, contracts
eventpilot up            # starts Redpanda (+ Postgres, if you enabled Outbox) in Docker
eventpilot dashboard      # opens the local control plane + web UI at localhost:4000
```

Then run the service it generated (`npm run dev` inside `services/<name>` for Node,
`gradle run` for Java) and watch events show up live in the dashboard.

```bash
eventpilot down    # stops the local infra when you're done
```

## Commands

| Command                      | What it does                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `eventpilot init`            | Wizard → generates `eventpilot.yaml`, `docker-compose.yml` and base service code                                 |
| `eventpilot doctor`          | Checks Node, Docker and the Docker daemon are ready                                                              |
| `eventpilot up` / `down`     | Starts / stops the local Docker infrastructure                                                                   |
| `eventpilot generate`        | Regenerates files from `eventpilot.yaml` (idempotent; `--force` to overwrite edits)                              |
| `eventpilot add <feature>`   | Adds `dlq` or `outbox` to an existing project                                                                    |
| `eventpilot validate`        | Validates `eventpilot.yaml` and, for any topic with a declared `schema:`, the real AsyncAPI/JSON Schema contract |
| `eventpilot dashboard`       | Starts the control plane + web UI (bundled — no separate install) for the project in the current directory       |
| `eventpilot replay <topic>`  | Prints events from a topic as JSON lines (`--from`, `--to`, `--limit`)                                           |
| `eventpilot metrics <topic>` | Measures throughput, consumer lag, DLQ count and error count for a topic                                         |

Run `eventpilot <command> --help` for a command's exact flags.

## What it generates

- `eventpilot.yaml` — the source of truth for your project (services, topics, features).
- `docker-compose.yml` — Redpanda + Redpanda Console (+ Postgres, with Outbox enabled).
- `services/<name>/` — a producer/consumer for the language you picked (Node/TypeScript
  or Java), wired to the topics declared in `eventpilot.yaml` and reporting traces to
  the control plane via an embedded SDK.

Enable DLQ (retry-with-backoff + dead-letter) or the Outbox pattern any time:

```bash
eventpilot add dlq
eventpilot add outbox
```

## Examples

- [`examples/orders-node`](./examples/orders-node) — Node/TypeScript, every feature on.
- [`examples/orders-java`](./examples/orders-java) — Java, every feature on.

## Status

Early-stage, pre-release. Phases 0–3 of the roadmap are done: the CLI above, the
Redpanda adapter, Node and Java generators, DLQ and Outbox (both languages), real
contract validation, and a control plane + dashboard fed by real SDKs
(`@pilotevent/sdk-node` and a generated Java equivalent). See
[`CLAUDE.md`, section 10](./CLAUDE.md#10-roadmap) for exactly what's open — mainly:
persisted metrics history, a Java SDK published to Maven Central instead of generated
inline, and a production deployment story for the control plane (today it's a local
dev tool: no auth, not meant to be exposed to the internet).

## Repository layout

See [`CLAUDE.md`, section 6](./CLAUDE.md#6-estrutura-do-repositório) for the monorepo
structure (`packages/`, `apps/`, `examples/`).

## Contributing

Want to work on EventPilot itself, rather than just use it? Clone the repo:

```bash
pnpm install          # install dependencies
pnpm build             # build every package (turbo)
pnpm dev               # watch mode
pnpm test              # run tests
pnpm lint              # lint + typecheck
pnpm format            # format with Prettier
pnpm changeset         # record a change for release
```

Then run the CLI straight from source instead of the published package:

```bash
node packages/cli/dist/bin.js doctor
node packages/cli/dist/bin.js init
```

For dashboard frontend work with hot reload: `pnpm --filter @pilotevent/dashboard dev`
(served at `http://localhost:5173`, proxying `/api` and `/ws` to the control plane on
port 4000) alongside `pnpm --filter @pilotevent/control-plane-api dev -- --project <path>`.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full guide, and
[`CLAUDE.md`](./CLAUDE.md) for the architecture and roadmap behind it.

## License

Apache-2.0 — see [`LICENSE`](./LICENSE).
