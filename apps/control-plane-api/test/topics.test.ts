import { describe, expect, it } from "vitest";

import { uniqueTopics } from "../src/topics.js";

describe("uniqueTopics", () => {
  it("deduplicates topics across produces and consumes", () => {
    const result = uniqueTopics([
      { produces: ["order.created", "order.cancelled"], consumes: ["payment.confirmed"] },
      { produces: ["payment.confirmed"], consumes: ["order.created"] },
    ]);

    expect(new Set(result)).toEqual(
      new Set(["order.created", "order.cancelled", "payment.confirmed"]),
    );
  });

  it("returns an empty list for no services", () => {
    expect(uniqueTopics([])).toEqual([]);
  });
});
