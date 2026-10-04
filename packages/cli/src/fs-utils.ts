import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { GeneratedFile } from "@eventpilot/plugin-api";

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export type WriteResult = "written" | "skipped";

/**
 * Writes a generated file without clobbering manual edits, unless the caller
 * passes --force (see CLAUDE.md, section 11: never overwrite without confirming).
 */
export async function writeGeneratedFile(
  file: GeneratedFile,
  options: { force: boolean },
): Promise<WriteResult> {
  const alreadyThere = await exists(file.path);
  if (alreadyThere && !options.force && !file.overwrite) {
    return "skipped";
  }
  await mkdir(path.dirname(file.path), { recursive: true });
  await writeFile(file.path, file.content, "utf-8");
  return "written";
}

export { exists };
