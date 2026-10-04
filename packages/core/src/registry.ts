import type { BrokerAdapter, FeatureModule, LanguageGenerator } from "@eventpilot/plugin-api";

function notFound(kind: string, id: string, available: string[]): Error {
  const list = available.length > 0 ? available.join(", ") : "(none registered)";
  return new Error(
    `No ${kind} plugin registered for "${id}". Available: ${list}.\n` +
      `Install the matching package and register it before calling generate/up.`,
  );
}

/**
 * Resolves plugin implementations by id. The core only ever talks to plugins
 * through this registry — never by importing a broker adapter or generator
 * package directly (see CLAUDE.md, section 4, principle 2).
 */
export class PluginRegistry {
  private readonly brokers = new Map<string, BrokerAdapter>();
  private readonly generators = new Map<string, LanguageGenerator>();
  private readonly features = new Map<string, FeatureModule>();

  registerBroker(adapter: BrokerAdapter): void {
    this.brokers.set(adapter.id, adapter);
  }

  registerGenerator(generator: LanguageGenerator): void {
    this.generators.set(generator.id, generator);
  }

  registerFeature(feature: FeatureModule): void {
    this.features.set(feature.id, feature);
  }

  getBroker(id: string): BrokerAdapter {
    const found = this.brokers.get(id);
    if (!found) throw notFound("broker", id, [...this.brokers.keys()]);
    return found;
  }

  getGenerator(id: string): LanguageGenerator {
    const found = this.generators.get(id);
    if (!found) throw notFound("language generator", id, [...this.generators.keys()]);
    return found;
  }

  getFeature(id: string): FeatureModule {
    const found = this.features.get(id);
    if (!found) throw notFound("feature module", id, [...this.features.keys()]);
    return found;
  }
}
