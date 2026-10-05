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
  only through the plugin registry (`@pilotevent/plugin-api`).
- Changes to `@pilotevent/plugin-api` are breaking changes for every plugin and need a
  major version bump via a changeset.
- Every plugin needs tests; generators use snapshot-style assertions on generated file
  content; broker adapters that touch Docker/Testcontainers should say so in their README.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
  `docs:`, `chore:`, ...). Enforced by a `commit-msg` hook (husky + commitlint) — commits
  that don't follow the format are rejected locally.
- Run `pnpm lint && pnpm test` before opening a PR. Keep PRs small and focused.
- Record user-facing changes with `pnpm changeset`.

## Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets) and
GitHub Actions — publishing by hand (`npm publish`/`pnpm publish`) is no longer the
normal path and should be avoided, since it skips the workspace-protocol resolution
`pnpm -r publish` does for you.

1. Every PR with a user-facing change includes a changeset (`pnpm changeset`), checked
   in alongside the code.
2. On merge to `master`, the [release workflow](./.github/workflows/release.yml) either
   opens/updates a "chore: version packages" PR (bumping versions and changelogs from the
   pending changesets) or, if that PR was just merged, publishes every changed package to
   npm with `pnpm -r publish`.
3. Requires an `NPM_TOKEN` repo secret — an npm **Automation** access token (bypasses
   2FA for publish), added under Settings → Secrets and variables → Actions.

## Code style

- TypeScript `strict: true`, ESM, no `any` without justification.
- CLI error messages must say what went wrong **and** how to fix it.
- Generated files are never silently overwritten — respect the `--force` flag.
