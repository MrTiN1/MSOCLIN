import "dotenv/config";
import { execFileSync } from "child_process";
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test"))
  throw new Error("Укажите отдельный TEST_DATABASE_URL с суффиксом _test");
const env = { ...process.env, DATABASE_URL: url, LOCAL_DEMO_SCHEDULE: "true" };
execFileSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { env, stdio: "inherit" },
);
execFileSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], {
  env,
  stdio: "inherit",
});
