import { regenerateProject } from "../regenerate.js";

export interface GenerateOptions {
  force?: boolean;
}

export async function generate(options: GenerateOptions): Promise<void> {
  await regenerateProject(options);
}
