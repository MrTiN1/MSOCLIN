import "dotenv/config";
import { defineConfig } from "vitest/config";
if (
  !process.env.TEST_DATABASE_URL ||
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Требуется отдельная база с суффиксом _test");
export default defineConfig({
  test: {
    include: ["tests/booking.integration.test.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      LOCAL_DEMO_SCHEDULE: "true",
    },
  },
});
