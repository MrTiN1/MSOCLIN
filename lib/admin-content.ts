import { z } from "zod";
import { db } from "./db";
import { HttpError } from "./security";
const image = z
  .string()
  .regex(
    /^(\/images\/|\/uploads\/|https:\/\/[^\s]+\.(?:public\.)?blob\.vercel-storage\.com\/)/,
    "Загрузите изображение в хранилище проекта",
  );
const schemas = {
  FAQ: z.object({
    question: z.string().min(4).max(250),
    answer: z.string().min(5).max(4000),
    position: z.number().int().min(0).max(100),
    published: z.boolean(),
  }),
  Promotion: z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(5).max(2000),
    sourceUrl: z.url().startsWith("https://"),
    active: z.boolean(),
  }),
  Review: z.object({
    author: z.string().min(1).max(100),
    text: z.string().min(5).max(4000),
    rating: z.number().int().min(1).max(5),
    sourceUrl: z.url().startsWith("https://"),
    source: z.string().min(2).max(80),
    verified: z.boolean(),
    published: z.boolean(),
  }),
  PortfolioItem: z.object({
    title: z.string().min(3).max(100),
    category: z.string().min(2).max(80),
    beforeImage: image,
    afterImage: image,
    description: z.string().min(3).max(2000),
    rightsConfirmed: z.boolean(),
    published: z.boolean(),
    sourceUrl: z.url().startsWith("https://").nullable().optional(),
  }),
  Service: z.object({
    slug: z.string().regex(/^[a-z][a-z0-9-]+$/),
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(4000),
    image,
    sourceUrl: z.url().startsWith("https://"),
    categoryId: z.string().min(1),
    durationMinutes: z.number().int().min(30).max(600),
    active: z.boolean(),
  }),
  ServicePrice: z.object({
    serviceId: z.string().min(1),
    label: z.string().min(2).max(100),
    material: z.string().min(2).max(40),
    amount: z.number().int().min(0).max(1000000),
    unit: z.enum(["item", "m2", "quote"]),
    preliminary: z.boolean(),
  }),
  ServiceCategory: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().regex(/^[a-z][a-z0-9-]+$/),
  }),
};
export const contentModels = {
  FAQ: db.fAQ,
  Promotion: db.promotion,
  Review: db.review,
  PortfolioItem: db.portfolioItem,
  Service: db.service,
  ServicePrice: db.servicePrice,
  ServiceCategory: db.serviceCategory,
};
export async function saveContent(
  model: string,
  id: string | undefined,
  input: unknown,
  actor: string,
) {
  const schema = schemas[model as keyof typeof schemas];
  if (!schema) throw new HttpError(400, "Недоступный тип контента");
  const v = schema.parse(input);
  if ("rightsConfirmed" in v && v.published && !v.rightsConfirmed)
    throw new HttpError(400, "Подтвердите права на обе фотографии");
  if ("verified" in v && v.published && !v.verified)
    throw new HttpError(400, "Подтвердите источник отзыва");
  // Schemas strip IDs, relations, timestamps and unknown fields before a write.
  const delegate = contentModels[
    model as keyof typeof contentModels
  ] as unknown as {
    upsert: (a: unknown) => Promise<{ id: string }>;
    create: (a: unknown) => Promise<{ id: string }>;
  };
  const row = id
    ? await delegate.upsert({ where: { id }, create: { ...v, id }, update: v })
    : await delegate.create({ data: v });
  await db.auditLog.create({
    data: { actor, action: "content.save." + model, entityId: row.id },
  });
  return row;
}
