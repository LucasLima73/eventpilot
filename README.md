# EventPilot

CLI + open source platform for event-driven architecture — no paid tier, ever (see
[`CLAUDE.md`](./CLAUDE.md), section 12). One command picks your language,
broker, contracts and features, then EventPilot generates the local infra (Docker), the
base service code, and a dashboard to configure topics/schemas/consumers, watch events
flow live, and track metrics.

> Full project context, architecture and roadmap live in [`CLAUDE.md`](./CLAUDE.md).
> New to the project? Start with [`docs/getting-started.md`](./docs/getting-started.md).

## Status

Early-stage, pre-release. Phases 0–3 of the roadmap are done: CLI (`init`/`up`/`generate`/
`add`/`validate`/`replay`/`metrics`/`dashboard`), Redpanda adapter, Node and Java
generators, DLQ and Outbox (both languages), real AsyncAPI/JSON Schema contract
validation, and a control plane + dashboard fed by real SDKs (`@pilotevent/sdk-node` and
a generated Java equivalent). See [`CLAUDE.md`, section 10](./CLAUDE.md#10-roadmap) for
exactly what's open (mainly: persisted metrics history, a Java SDK published to Maven
Central instead of generated inline, and SSO/hosted-anything — none planned yet).

## Quickstart

```bash
pnpm install
pnpm build

# from an empty project directory:
node packages/cli/dist/bin.js doctor   # checks Node + Docker
node packages/cli/dist/bin.js init     # wizard: project name, service, events, contracts
node packages/cli/dist/bin.js up       # starts Redpanda + console locally
node packages/cli/dist/bin.js generate # regenerate code after editing eventpilot.yaml
node packages/cli/dist/bin.js down     # stops the local infra
```

Published on npm — the same commands run as `npx eventpilot <command>`.

## Dashboard

```bash
eventpilot dashboard
```

Starts the control plane (bundled with `eventpilot`) and opens the dashboard at
`http://localhost:4000` for the project in your current directory. Needs an
`eventpilot.yaml` (from `eventpilot init`) and a running broker (`eventpilot up`).
Use `--port` to pick a different port.

For dashboard frontend development with hot reload instead, from the monorepo: run
`pnpm --filter @pilotevent/dashboard dev` (served at `http://localhost:5173`, proxying
`/api` and `/ws` to the control plane on port 4000) alongside
`pnpm --filter @pilotevent/control-plane-api dev -- --project <path>`.

## What it generates

- `eventpilot.yaml` — the source of truth for your project (services, topics, features).
- `docker-compose.yml` — Redpanda + Redpanda Console, wired to the broker config in the YAML.
- `services/<name>/` — a producer/consumer Node/TypeScript service using `kafkajs`,
  wired to the topics declared in `eventpilot.yaml`.

## Repository layout

See [`CLAUDE.md`, section 6](./CLAUDE.md#6-estrutura-do-repositório) for the target
monorepo structure (`packages/`, `apps/`, `sdk/`, `examples/`).

## Development

```bash
pnpm install          # install dependencies
pnpm build             # build every package (turbo)
pnpm dev               # watch mode
pnpm test              # run tests
pnpm lint              # lint + typecheck
pnpm format            # format with Prettier
pnpm changeset         # record a change for release
```

## License

Apache-2.0 — see [`LICENSE`](./LICENSE).
