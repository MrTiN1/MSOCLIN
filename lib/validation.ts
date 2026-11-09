import { z } from "zod";
export const quoteSchema = z.object({
  serviceId: z.string().min(1),
  priceId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  extras: z
    .array(
      z.enum(["heavy", "odor", "steam", "antistatic", "dry", "antibacterial"]),
    )
    .max(6)
    .default([]),
});
export const customerSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(80),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => /^[78]\d{10}$/.test(s), "Укажите российский телефон")
    .transform((s) => "7" + s.slice(1)),
  address: z.string().trim().min(8, "Укажите адрес").max(400),
  comment: z.string().trim().max(1500).default(""),
  consent: z.literal(true, { error: "Необходимо согласие" }),
  website: z.string().max(0).default(""),
});
export const bookingSchema = customerSchema.extend({
  selection: quoteSchema,
  startsAt: z.iso.datetime({ offset: true }),
  idempotencyKey: z.uuid(),
  accessToken: z.string().regex(/^[a-f0-9]{64}$/),
});
export const callbackSchema = customerSchema
  .omit({ address: true })
  .extend({
    address: z.string().max(400).default("Обратный звонок"),
    idempotencyKey: z.uuid(),
    accessToken: z.string().regex(/^[a-f0-9]{64}$/),
  });
export type Selection = z.infer<typeof quoteSchema>;
