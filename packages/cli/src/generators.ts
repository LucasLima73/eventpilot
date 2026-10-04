import { nodeTsGenerator } from "@eventpilot/gen-node";
import type { LanguageGenerator } from "@eventpilot/plugin-api";

const generators = new Map<string, LanguageGenerator>([[nodeTsGenerator.id, nodeTsGenerator]]);

export function resolveGenerator(language: string): LanguageGenerator {
  const generator = generators.get(language);
  if (!generator) {
    const available = [...generators.keys()].join(", ") || "(none)";
    throw new Error(
      `No language generator for "${language}". Available: ${available}.\n` +
        "Java support is planned (Phase 2) but not implemented yet.",
    );
  }
  return generator;
}
