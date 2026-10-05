import type { Consumer, EachMessagePayload } from "kafkajs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { wrapConsumer } from "../src/wrap-consumer.js";

function fakeConsumer() {
  const connect = vi.fn().mockResolvedValue(undefined);
  const disconnect = vi.fn().mockResolvedValue(undefined);
  const subscribe = vi.fn().mockResolvedValue(undefined);
  const run = vi.fn().mockResolvedValue(undefined);
  const consumer = { connect, disconnect, subscribe, run } as unknown as Consumer;
  return { consumer, run };
}

function fakePayload(headers: Record<string, string> = {}): EachMessagePayload {
  return {
    topic: "order.created",
    partition: 0,
    message: {
      key: null,
      value: Buffer.from("{}"),
      headers,
      timestamp: String(Date.now()),
      attributes: 0,
      offset: "0",
    },
    heartbeat: vi.fn(),
    pause: vi.fn(),
  } as unknown as EachMessagePayload;
}

describe("wrapConsumer", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 202 })));
  });

  it("still calls the caller's eachMessage handler", async () => {
    const { consumer, run } = fakeConsumer();
    const wrapped = wrapConsumer(consumer, {
      service: "payment-service",
      controlPlaneUrl: "http://cp.local",
    });
    const eachMessage = vi.fn().mockResolvedValue(undefined);

    await wrapped.run({ eachMessage });
    const instrumented = run.mock.calls[0][0].eachMessage;
    const payload = fakePayload({ "x-correlation-id": "abc" });
    await instrumented(payload);

    expect(eachMessage).toHaveBeenCalledWith(payload);
  });

  it("reports a consume trace with the message's correlation/causation ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { consumer, run } = fakeConsumer();
    const wrapped = wrapConsumer(consumer, {
      service: "payment-service",
      controlPlaneUrl: "http://cp.local",
    });

    await wrapped.run({ eachMessage: vi.fn().mockResolvedValue(undefined) });
    const instrumented = run.mock.calls[0][0].eachMessage;
    await instrumented(fakePayload({ "x-correlation-id": "abc", "x-causation-id": "root" }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({
      service: "payment-service",
      direction: "consume",
      topic: "order.created",
      correlationId: "abc",
      causationId: "root",
    });
  });

  it("reports null ids when the message carries none", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { consumer, run } = fakeConsumer();
    const wrapped = wrapConsumer(consumer, {
      service: "payment-service",
      controlPlaneUrl: "http://cp.local",
    });

    await wrapped.run({ eachMessage: vi.fn().mockResolvedValue(undefined) });
    const instrumented = run.mock.calls[0][0].eachMessage;
    await instrumented(fakePayload());

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toMatchObject({ correlationId: null, causationId: null });
  });
});

describe("wrapConsumer error reporting", () => {
  it("reports an error trace and rethrows when the handler fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { consumer, run } = fakeConsumer();
    const wrapped = wrapConsumer(consumer, {
      service: "payment-service",
      controlPlaneUrl: "http://cp.local",
    });

    const failure = new Error("boom");
    await wrapped.run({ eachMessage: vi.fn().mockRejectedValue(failure) });
    const instrumented = run.mock.calls[0][0].eachMessage;

    await expect(instrumented(fakePayload({ "x-correlation-id": "abc" }))).rejects.toThrow("boom");

    const errorCall = fetchMock.mock.calls.find((call) => {
      const body = JSON.parse(call[1].body as string);
      return body.direction === "error";
    });
    expect(errorCall).toBeDefined();
    const body = JSON.parse(errorCall![1].body as string);
    expect(body).toMatchObject({
      service: "payment-service",
      direction: "error",
      topic: "order.created",
      correlationId: "abc",
      error: "boom",
    });
  });
});
