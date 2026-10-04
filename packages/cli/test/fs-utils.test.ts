import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { writeGeneratedFile } from "../src/fs-utils.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "eventpilot-cli-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("writeGeneratedFile", () => {
  it("writes a new file, creating parent directories", async () => {
    const filePath = path.join(dir, "nested", "file.ts");
    const result = await writeGeneratedFile({ path: filePath, content: "hello" }, { force: false });

    expect(result).toBe("written");
    expect(await readFile(filePath, "utf-8")).toBe("hello");
  });

  it("skips an existing file without --force", async () => {
    const filePath = path.join(dir, "file.ts");
    await writeGeneratedFile({ path: filePath, content: "first" }, { force: false });
    const result = await writeGeneratedFile(
      { path: filePath, content: "second" },
      { force: false },
    );

    expect(result).toBe("skipped");
    expect(await readFile(filePath, "utf-8")).toBe("first");
  });

  it("overwrites an existing file with --force", async () => {
    const filePath = path.join(dir, "file.ts");
    await writeGeneratedFile({ path: filePath, content: "first" }, { force: false });
    const result = await writeGeneratedFile({ path: filePath, content: "second" }, { force: true });

    expect(result).toBe("written");
    expect(await readFile(filePath, "utf-8")).toBe("second");
  });
});
