import { describe, expect, it, vi } from "vitest";

import { createEventPilotAgent } from "../src/index.js";

describe("createEventPilotAgent.reportError", () => {
  it("posts an error trace to the control plane", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const agent = createEventPilotAgent({
      service: "order-service",
      controlPlaneUrl: "http://cp.local",
    });
    agent.reportError("order.created", "corr-1", new Error("boom"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://cp.local/api/traces",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({
      service: "order-service",
      direction: "error",
      topic: "order.created",
      correlationId: "corr-1",
      error: "boom",
    });
  });
});
