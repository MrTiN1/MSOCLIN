import { db } from "./db";
import { quoteSchema, type Selection } from "./validation";
import { defaultPricingRules } from "./data";
export type Quote = {
  base: number;
  extras: { key: string; label: string; amount: number }[];
  subtotal: number;
  minimum: number;
  total: number;
  preliminary: boolean;
  durationMinutes: number;
  serviceTitle: string;
  priceLabel: string;
  material: string;
  quantity: number;
  manual?: boolean;
  availableExtras: {
    key: string;
    label: string;
    amount: number;
    percent?: boolean;
  }[];
};
export function calculatePrice(
  amount: number,
  selection: Selection,
  slug: string,
  minimum: number,
  duration: number,
  rules = defaultPricingRules,
): Omit<Quote, "serviceTitle" | "priceLabel" | "material"> {
  const base = amount * selection.quantity;
  const available = rules[slug] ?? {};
  const extras = [...new Set(selection.extras)].map((key) => {
    const rule = available[key];
    if (!rule)
      throw new Error(
        "Эта дополнительная услуга требует отдельного согласования",
      );
    return {
      key,
      label: rule.label,
      amount: rule.percent
        ? Math.round((base * rule.amount) / 100)
        : rule.amount,
    };
  });
  const subtotal = base + extras.reduce((a, b) => a + b.amount, 0);
  return {
    base,
    extras,
    subtotal,
    minimum,
    total: Math.max(subtotal, minimum),
    preliminary: true,
    durationMinutes:
      duration *
        Math.ceil(
          selection.quantity / (["carpet", "curtains"].includes(slug) ? 10 : 1),
        ) +
      extras.length * 15,
    quantity: selection.quantity,
    availableExtras: Object.entries(available).map(([key, r]) => ({
      key,
      ...r,
    })),
  };
}
export async function getQuote(
  input: unknown,
  client: typeof db = db,
): Promise<Quote> {
  const s = quoteSchema.parse(input);
  const price = await client.servicePrice.findUnique({
    where: { id: s.priceId },
    include: { service: true },
  });
  if (price?.unit === "quote" && s.quantity !== 1)
    throw new Error("Объём требует консультации");
  if (!price || price.serviceId !== s.serviceId || !price.service.active)
    throw new Error("Выберите доступную услугу и вариант");
  const settings = await client.siteSettings.findUnique({
    where: { key: "pricing" },
  });
  const config = settings?.value as
    { minimum: number; rules: typeof defaultPricingRules } | undefined;
  if (!config?.rules) throw new Error("Правила цены не настроены");
  const minimum = config.minimum;
  return {
    ...calculatePrice(
      price.amount,
      s,
      price.service.slug,
      minimum,
      price.service.durationMinutes,
      config.rules,
    ),
    serviceTitle: price.service.title,
    priceLabel: price.label,
    material: price.material,
    manual: price.unit === "quote",
  };
}
