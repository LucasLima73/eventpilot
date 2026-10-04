import { describe, expect, it } from "vitest";

import { mergeFragments, renderCompose } from "../src/compose-writer.js";

describe("mergeFragments", () => {
  it("merges services and volumes from multiple fragments", () => {
    const merged = mergeFragments(
      { services: { redpanda: { image: "redpanda" } } },
      { services: { postgres: { image: "postgres" } }, volumes: { data: {} } },
    );

    expect(Object.keys(merged.services)).toEqual(["redpanda", "postgres"]);
    expect(merged.volumes).toEqual({ data: {} });
  });
});

describe("renderCompose", () => {
  it("omits the volumes key when there are none", () => {
    const yaml = renderCompose({ services: { redpanda: { image: "redpanda" } } });
    expect(yaml).not.toContain("volumes:");
  });

  it("includes volumes when present", () => {
    const yaml = renderCompose({ services: {}, volumes: { data: {} } });
    expect(yaml).toContain("volumes:");
  });
});
