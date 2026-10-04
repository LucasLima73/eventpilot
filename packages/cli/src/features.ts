import { dlqFeature } from "@eventpilot/feature-dlq";
import type { FeatureModule } from "@eventpilot/plugin-api";

const features = new Map<string, FeatureModule>([[dlqFeature.id, dlqFeature]]);

export function resolveFeature(id: string): FeatureModule {
  const feature = features.get(id);
  if (!feature) {
    const available = [...features.keys()].join(", ") || "(none)";
    throw new Error(`No feature module for "${id}". Implemented: ${available}.`);
  }
  return feature;
}

export function implementedFeatures(): string[] {
  return [...features.keys()];
}
