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
    // The default worker pools fail on this machine before any test runs ("Cannot
    // read properties of undefined (reading 'config')"); vmThreads runs them.
    pool: "vmThreads",
    // The 50,000-case property tests are slower under that pool.
    testTimeout: 30000,
    include: ["lib/**/*.test.ts"],
  },
});
