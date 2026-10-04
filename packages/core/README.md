# @pilotevent/core

Source of truth parsing for `eventpilot.yaml`, plus the plugin registry that resolves
broker adapters, language generators and feature modules by id.

- `schema.ts` — Zod schema for `eventpilot.yaml` (see `CLAUDE.md`, section 7, for the
  reference example).
- `loader.ts` — reads + validates a config file, with error messages that say what's
  wrong and how to fix it.
- `registry.ts` — `PluginRegistry`, the only way `core` talks to plugins.
