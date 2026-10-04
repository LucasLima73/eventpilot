import { javaGenerator } from "@pilotevent/gen-java";
import { nodeTsGenerator } from "@pilotevent/gen-node";
import type { LanguageGenerator } from "@pilotevent/plugin-api";

const generators = new Map<string, LanguageGenerator>([
  [nodeTsGenerator.id, nodeTsGenerator],
  [javaGenerator.id, javaGenerator],
]);

export function resolveGenerator(language: string): LanguageGenerator {
  const generator = generators.get(language);
  if (!generator) {
    const available = [...generators.keys()].join(", ") || "(none)";
    throw new Error(`No language generator for "${language}". Available: ${available}.`);
  }
  return generator;
}
