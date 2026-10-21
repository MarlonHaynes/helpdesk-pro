import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{js,jsx}", "tests/**/*.test.{js,jsx}"],
    globals: true,
    // Rules tests share one Firestore emulator and call clearFirestore(), so
    // test files must not run in parallel against the same project.
    fileParallelism: false,
  },
});
