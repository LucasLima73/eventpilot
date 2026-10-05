import { describe, expect, it } from "vitest";

import { AsyncQueue } from "../src/async-queue.js";

describe("AsyncQueue", () => {
  it("yields items pushed before iteration starts", async () => {
    const queue = new AsyncQueue<number>();
    queue.push(1);
    queue.push(2);
    queue.close();

    const received: number[] = [];
    for await (const item of queue) received.push(item);

    expect(received).toEqual([1, 2]);
  });

  it("yields items pushed after iteration has started", async () => {
    const queue = new AsyncQueue<number>();
    const received: number[] = [];

    const consume = (async () => {
      for await (const item of queue) received.push(item);
    })();

    await new Promise((resolve) => setTimeout(resolve, 10));
    queue.push(1);
    queue.push(2);
    queue.close();
    await consume;

    expect(received).toEqual([1, 2]);
  });

  it("stops iteration once closed with no pending items", async () => {
    const queue = new AsyncQueue<number>();
    queue.close();

    const received: number[] = [];
    for await (const item of queue) received.push(item);

    expect(received).toEqual([]);
  });
});
