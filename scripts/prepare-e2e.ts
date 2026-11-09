import "dotenv/config";
import { writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { db } from "../lib/db";
import { hashPassword } from "../lib/security";
async function main() {
  const url = process.env.TEST_DATABASE_URL;
  if (
    !url ||
    process.env.DATABASE_URL !== url ||
    !new URL(url).pathname.endsWith("_test")
  )
    throw Error("Preview must use the dedicated test database");
  const password = randomBytes(24).toString("hex");
  const email = "e2e@example.test";
  await db.booking.deleteMany();
  await db.customer.deleteMany();
  await db.rateLimit.deleteMany();
  await db.scheduleException.deleteMany();
  await db.team.updateMany({ data: { active: true } });
  await db.user.upsert({
    where: { email },
    create: { email, passwordHash: hashPassword(password) },
    update: {
      passwordHash: hashPassword(password),
      sessionVersion: { increment: 1 },
    },
  });
  writeFileSync(
    ".env.e2e",
    `E2E_ADMIN_EMAIL=${email}\nE2E_ADMIN_PASSWORD=${password}\nDATABASE_URL=${url}\n`,
    { mode: 0o600 },
  );
  console.log("Изолированная база E2E подготовлена.");
}
main().finally(() => db.$disconnect());
