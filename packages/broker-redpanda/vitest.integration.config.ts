import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/integration/**/*.test.ts"],
    // Starting a real Redpanda container takes a while.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
