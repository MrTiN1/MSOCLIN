import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  categories,
  seedServices,
  faqs,
  company,
  defaultPricingRules,
  defaultTexts,
} from "../lib/data";
const db = new PrismaClient();
async function main() {
  for (const c of categories)
    await db.serviceCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  for (const s of seedServices) {
    const cat = await db.serviceCategory.findUniqueOrThrow({
      where: { slug: s.category },
    });
    const service = await db.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug,
        title: s.title,
        description: s.description,
        image: `/images/${s.image}.jpg`,
        sourceUrl: `${company.source}/${s.source}/`,
        durationMinutes: s.duration,
        categoryId: cat.id,
      },
    });
    for (const [label, material, amount] of s.prices)
      await db.servicePrice.upsert({
        where: {
          serviceId_label_material: { serviceId: service.id, label, material },
        },
        update: {},
        create: {
          serviceId: service.id,
          label,
          material,
          amount,
          unit:
            material === "consultation"
              ? "quote"
              : label.includes("м²")
                ? "m2"
                : "item",
        },
      });
  }
  for (let i = 0; i < faqs.length; i++)
    await db.fAQ.upsert({
      where: { question: faqs[i][0] },
      update: {},
      create: { question: faqs[i][0], answer: faqs[i][1], position: i },
    });
  // Safe inactive defaults: the operator must enable teams after verifying their real schedules.
  for (let i = 1; i <= 2; i++) {
    const team = await db.team.upsert({
      where: { id: `team-${i}` },
      update: {},
      create: {
        id: `team-${i}`,
        name: `Бригада ${i}`,
        active: process.env.LOCAL_DEMO_SCHEDULE === "true",
        travelMinutes: 30,
      },
    });
    for (let day = 0; day < 7; day++)
      await db.teamSchedule.upsert({
        where: { teamId_weekday: { teamId: team.id, weekday: day } },
        update: {},
        create: {
          teamId: team.id,
          weekday: day,
          startMinute: 540,
          endMinute: 1140,
          breakStart: 780,
          breakEnd: 840,
        },
      });
  }
  for (const [key, value] of Object.entries({
    company,
    texts: defaultTexts,
    bookingPolicy: {
      holdMinutes: 120,
      slotStepMinutes: 60,
      advanceMinutes: 60,
      horizonDays: 90,
    },
    pricing: { minimum: 4500, rules: defaultPricingRules },
  }))
    await db.siteSettings.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  for (const [id, title, description] of [
    [
      "first",
      "Скидка 5%",
      "Новым клиентам. Условия и применимость уточняйте у менеджера.",
    ],
    [
      "family",
      "Скидка 7%",
      "Многодетным семьям. Условия уточняйте у менеджера.",
    ],
    [
      "social",
      "Скидка 15%",
      "Пенсионерам или людям с инвалидностью. Условия уточняйте у менеджера.",
    ],
  ])
    await db.promotion.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title,
        description,
        sourceUrl: company.source + "/discounts/",
      },
    });
  console.log(
    "Справочники созданы. Расписание активно только при LOCAL_DEMO_SCHEDULE=true.",
  );
}
main().finally(() => db.$disconnect());
