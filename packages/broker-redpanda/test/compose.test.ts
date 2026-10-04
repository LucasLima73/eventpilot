import { describe, expect, it } from "vitest";

import { composeService } from "../src/compose.js";

describe("composeService", () => {
  it("generates a redpanda + console compose fragment", () => {
    const fragment = composeService({ type: "redpanda", version: "latest" });
    expect(fragment.services.redpanda).toBeDefined();
    expect(fragment.services["redpanda-console"]).toBeDefined();
  });

  it("pins the image tag to the requested version", () => {
    const fragment = composeService({ type: "redpanda", version: "v24.2.7" });
    const redpanda = fragment.services.redpanda as { image: string };
    expect(redpanda.image).toContain("v24.2.7");
  });
});
