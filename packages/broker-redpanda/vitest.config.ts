import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests need a real Docker container (via testcontainers) and are
    // slow — kept out of the default `vitest run` so `pnpm test` (and husky's
    // pre-commit hook) stay fast. Run them explicitly with `pnpm test:integration`.
    exclude: ["**/node_modules/**", "**/integration/**"],
  },
});
