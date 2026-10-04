# @eventpilot/plugin-api

Public contracts for EventPilot plugins: `BrokerAdapter`, `LanguageGenerator`, `FeatureModule`.

The `core` package never imports a broker adapter, language generator, or feature module
directly — it only depends on these interfaces and resolves concrete implementations
through a plugin registry.

Changes to this package are breaking changes for every plugin and require a major
version bump plus a changeset (see `CLAUDE.md`, section 8).
