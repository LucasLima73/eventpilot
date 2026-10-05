import type { Producer } from "kafkajs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { wrapProducer } from "../src/wrap-producer.js";

function fakeProducer() {
  const send = vi.fn().mockResolvedValue([]);
  const connect = vi.fn().mockResolvedValue(undefined);
  const disconnect = vi.fn().mockResolvedValue(undefined);
  const producer = { connect, disconnect, send } as unknown as Producer;
  return { producer, send };
}

describe("wrapProducer", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 202 })),
    );
  });

  it("generates a correlation id when the caller didn't set one", async () => {
    const { producer, send } = fakeProducer();
    const wrapped = wrapProducer(producer, {
      service: "order-service",
      controlPlaneUrl: "http://cp.local",
    });

    await wrapped.send({ topic: "order.created", messages: [{ value: "{}" }] });

    expect(send).toHaveBeenCalledTimes(1);
    const sent = send.mock.calls[0][0];
    expect(sent.messages[0].headers?.["x-correlation-id"]).toBeTruthy();
  });

  it("keeps an existing correlation id and causation id", async () => {
    const { producer, send } = fakeProducer();
    const wrapped = wrapProducer(producer, {
      service: "order-service",
      controlPlaneUrl: "http://cp.local",
    });

    await wrapped.send({
      topic: "order.created",
      messages: [
        { value: "{}", headers: { "x-correlation-id": "abc", "x-causation-id": "root" } },
      ],
    });

    const sent = send.mock.calls[0][0];
    expect(sent.messages[0].headers?.["x-correlation-id"]).toBe("abc");
    expect(sent.messages[0].headers?.["x-causation-id"]).toBe("root");
  });

  it("reports a produce trace to the control plane", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { producer } = fakeProducer();
    const wrapped = wrapProducer(producer, {
      service: "order-service",
      controlPlaneUrl: "http://cp.local",
    });

    await wrapped.send({ topic: "order.created", messages: [{ value: "{}" }] });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://cp.local/api/traces",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ service: "order-service", direction: "produce", topic: "order.created" });
  });

  it("still sends even if the control plane is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const { producer } = fakeProducer();
    const wrapped = wrapProducer(producer, {
      service: "order-service",
      controlPlaneUrl: "http://cp.local",
    });

    await expect(
      wrapped.send({ topic: "order.created", messages: [{ value: "{}" }] }),
    ).resolves.toEqual([]);
  });
});
