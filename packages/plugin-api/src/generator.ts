export interface GeneratedFile {
  /** Path relative to the project root. */
  path: string;
  content: string;
  /** Overwrite an existing file even without --force. Defaults to false. */
  overwrite?: boolean;
}

export interface ServiceSpec {
  name: string;
  language: string;
  produces: string[];
  consumes: string[];
}

export interface GenerateContext {
  projectName: string;
  service: ServiceSpec;
  topics: Array<{ name: string; schema?: string }>;
  outputDir: string;
}

/** A plugin that generates producer/consumer/outbox/DLQ code for one language. */
export interface LanguageGenerator {
  id: string; // "node-ts" | "java"
  generate(ctx: GenerateContext): Promise<GeneratedFile[]>;
}
