import { dlqFeature } from "@pilotevent/feature-dlq";
import { outboxFeature } from "@pilotevent/feature-outbox";
import type { FeatureModule } from "@pilotevent/plugin-api";

const features = new Map<string, FeatureModule>([
  [dlqFeature.id, dlqFeature],
  [outboxFeature.id, outboxFeature],
]);

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
