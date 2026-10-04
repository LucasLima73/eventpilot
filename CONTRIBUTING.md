# Contributing to EventPilot

Thanks for your interest in contributing. Read [`CLAUDE.md`](./CLAUDE.md) first — it holds
the full project context, architecture and roadmap.

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Guidelines

- Check which [roadmap phase](./CLAUDE.md#10-roadmap) your change belongs to; avoid
  building ahead of the current phase.
- `core` never imports a broker adapter, language generator or feature module directly —
  only through the plugin registry (`@eventpilot/plugin-api`).
- Changes to `@eventpilot/plugin-api` are breaking changes for every plugin and need a
  major version bump via a changeset.
- Every plugin needs tests; generators use snapshot-style assertions on generated file
  content; broker adapters that touch Docker/Testcontainers should say so in their README.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
  `docs:`, `chore:`, ...). Enforced by a `commit-msg` hook (husky + commitlint) — commits
  that don't follow the format are rejected locally.
- Run `pnpm lint && pnpm test` before opening a PR. Keep PRs small and focused.
- Record user-facing changes with `pnpm changeset`.

## Code style

- TypeScript `strict: true`, ESM, no `any` without justification.
- CLI error messages must say what went wrong **and** how to fix it.
- Generated files are never silently overwritten — respect the `--force` flag.
