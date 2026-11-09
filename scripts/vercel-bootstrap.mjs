import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

// Vercel injects the database credentials into its own build environment.
// Local builds never apply migrations or initialize accounts.
if (process.env.VERCEL === "1") {
  const target = process.env.VERCEL_ENV;
  if (!["preview", "production"].includes(target)) {
    throw new Error("Database bootstrap requires Preview or Production");
  }
  if (target === "production" && process.env.LOCAL_DEMO_SCHEDULE === "true") {
    throw new Error("Demo schedules must be disabled in Production");
  }
  const databaseUrl =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is missing");
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  const hidden = Object.entries(env)
    .filter(
      ([key, value]) => /URL|SECRET|TOKEN|PASSWORD|HASH/.test(key) && value,
    )
    .map(([, value]) => value);
  function run(args, label) {
    const result = spawnSync(process.execPath, args, {
      env,
      encoding: "utf8",
      timeout: 180000,
      maxBuffer: 2097152,
    });
    if (result.status !== 0) {
      let details = result.stderr + result.stdout;
      for (const value of hidden)
        details = details.split(value).join("[redacted]");
      throw new Error(`${label} failed: ${details}`);
    }
    console.log(`${label}: success`);
  }
  run(
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    "Migrations",
  );
  run(["--import", "tsx", "prisma/seed.ts"], "Reference data");
  const db = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const passwordHash = process.env.ADMIN_BOOTSTRAP_HASH;
    if (email && passwordHash) {
      if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash)) {
        throw new Error("Invalid ADMIN_BOOTSTRAP_HASH format");
      }
      await db.user.upsert({
        where: { email },
        update: {},
        create: { email, passwordHash },
      });
      console.log("Administrator initialized; existing passwords preserved");
    }
    const constraints = await db.$queryRaw`
      SELECT conname FROM pg_constraint
      WHERE conname = 'team_no_overlapping_bookings'
    `;
    if (constraints.length !== 1)
      throw new Error("Booking constraint is missing");
    console.log(
      JSON.stringify({
        environment: target,
        services: await db.service.count(),
        teams: await db.team.count(),
        activeTeams: await db.team.count({ where: { active: true } }),
        overlapConstraint: true,
      }),
    );
  } finally {
    await db.$disconnect();
  }
}
