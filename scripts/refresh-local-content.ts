import "dotenv/config";
import { db } from "../lib/db";
import { seedServices } from "../lib/data";
async function main() {
  if (process.env.LOCAL_DEMO_SCHEDULE !== "true")
    throw Error("Only local development content");
  for (const s of seedServices) {
    const row = await db.service.findUnique({ where: { slug: s.slug } });
    if (!row) continue;
    const allowed = s.prices.map(([label, material]) => ({ label, material }));
    await db.servicePrice.deleteMany({
      where: { serviceId: row.id, NOT: { OR: allowed } },
    });
    await db.service.update({
      where: { id: row.id },
      data: { description: s.description },
    });
  }
}
main().finally(() => db.$disconnect());
