import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for the pure logic in lib/ (money, budgets, categorisation, CSV
// import, recurring schedules). They run in plain Node: no browser, no database.
export default defineConfig({
  resolve: {
    // Same "@/..." imports as the app (see "paths" in tsconfig.json).
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
