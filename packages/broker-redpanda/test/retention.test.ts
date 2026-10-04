import { describe, expect, it } from "vitest";

import { retentionToMs } from "../src/retention.js";

describe("retentionToMs", () => {
  it.each([
    ["7d", 7 * 86_400_000],
    ["24h", 24 * 3_600_000],
    ["30m", 30 * 60_000],
    ["45s", 45 * 1_000],
  ])("converts %s to %i ms", (input, expected) => {
    expect(retentionToMs(input)).toBe(expected);
  });

  it("rejects an invalid duration", () => {
    expect(() => retentionToMs("forever")).toThrowError(/Invalid retention/);
  });
});
