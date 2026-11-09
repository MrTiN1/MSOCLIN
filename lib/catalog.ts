import { db } from "./db";
import { company, defaultTexts } from "./data";
export async function getServices() {
  return db.service.findMany({
    where: { active: true },
    include: { prices: { orderBy: { amount: "asc" } }, category: true },
    orderBy: { id: "asc" },
  });
}
export type ServiceDTO = Awaited<ReturnType<typeof getServices>>[number];
export async function getCompany() {
  const row = await db.siteSettings.findUnique({ where: { key: "company" } });
  return { ...company, ...(row?.value as object) };
}

export async function getTexts() {
  const row = await db.siteSettings.findUnique({ where: { key: "texts" } });
  return { ...defaultTexts, ...(row?.value as object) };
}
export async function getMinimum() {
  const row = await db.siteSettings.findUnique({ where: { key: "pricing" } });
  return Number((row?.value as { minimum?: number })?.minimum ?? 4500);
}
