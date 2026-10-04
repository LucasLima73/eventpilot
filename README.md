# EventPilot

CLI + open-core platform for event-driven architecture. One command picks your language,
broker, contracts and features, then EventPilot generates the local infra (Docker), the
base service code, and a dashboard to configure topics/schemas/consumers, watch events
flow live, and track metrics.

> Full project context, architecture and roadmap live in [`CLAUDE.md`](./CLAUDE.md).

## Status

Early-stage, pre-release. Phase 0 (monorepo foundation), the core of Phase 1
(CLI + Redpanda compose generation + Node/TS generator) and a first slice of Phase 3
(control plane + dashboard, reading the broker directly rather than via a real SDK yet)
are implemented. See [`CLAUDE.md`, section 10](./CLAUDE.md#10-roadmap) for what's next.

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

Once published, the same commands run as `npx eventpilot <command>`.

## Dashboard

The control plane and dashboard aren't wired into `eventpilot dashboard` yet (that
packaging step is still open), but both already work:

```bash
pnpm --filter @eventpilot/dashboard build
node apps/control-plane-api/dist/bin.js --project <path-to-your-project> --port 4000
```

Then open `http://localhost:4000`. Your project needs an `eventpilot.yaml` (from
`eventpilot init`) and a running broker (`eventpilot up`). For frontend development with
hot reload instead, run `pnpm --filter @eventpilot/dashboard dev` (served at
`http://localhost:5173`, proxying `/api` and `/ws` to the control plane on port 4000)
alongside `pnpm --filter @eventpilot/control-plane-api dev -- --project <path>`.

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
