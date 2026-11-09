import { describe, it, expect } from "vitest";
import { calculatePrice } from "../lib/pricing";
import { overlaps, atMinute, moscowDate } from "../lib/scheduling";
import { bookingSchema } from "../lib/validation";
import { hashPassword, verifyPassword } from "../lib/security";
const selection = {
  serviceId: "s",
  priceId: "p",
  quantity: 1,
  extras: [] as ("heavy" | "odor")[],
};
describe("Прозрачный расчёт стоимости", () => {
  it("учитывает минимальный выезд один раз на заказ", () => {
    const q = calculatePrice(1500, selection, "sofa", 4500, 120);
    expect(q.base).toBe(1500);
    expect(q.total).toBe(4500);
  });
  it("учитывает материал, количество, проценты от базы и фиксированную допуслугу", () => {
    const q = calculatePrice(
      3500,
      { ...selection, quantity: 2, extras: ["heavy", "odor"] },
      "sofa",
      4500,
      120,
    );
    expect(q.total).toBe(11400);
    expect(q.durationMinutes).toBe(270);
  });
  it("берёт изменённые правила из настроек, не дублирует опции", () => {
    const q = calculatePrice(
      5000,
      { ...selection, extras: ["odor", "odor"] },
      "sofa",
      4500,
      120,
      { sofa: { odor: { label: "Запах", amount: 1200 } } },
    );
    expect(q.total).toBe(6200);
    expect(q.extras).toHaveLength(1);
  });
  it("не позволяет покупать неподтверждённую допуслугу", () =>
    expect(() =>
      calculatePrice(
        1000,
        { ...selection, extras: ["odor"] },
        "leather",
        4500,
        120,
      ),
    ).toThrow());
});
describe("Временные интервалы", () => {
  it("сохраняет московское начало в UTC", () =>
    expect(atMinute("2026-11-15", 540).toISOString()).toBe(
      "2026-11-15T06:00:00.000Z",
    ));
  it("использует дату Москвы около полуночи", () =>
    expect(moscowDate(new Date("2026-11-09T22:00:00Z"))).toBe("2026-11-10"));
  it("не считает соприкасающиеся интервалы пересечением", () => {
    const d = (n: number) => new Date(n);
    expect(overlaps(d(0), d(10), d(10), d(20))).toBe(false);
    expect(overlaps(d(0), d(11), d(10), d(20))).toBe(true);
  });
});
describe("Безопасность", () => {
  it("не принимает отрицательное количество и отсутствие согласия", () =>
    expect(
      bookingSchema.safeParse({
        selection: { ...selection, quantity: -1 },
        consent: false,
      }).success,
    ).toBe(false));
  it("хеширует пароль с индивидуальной солью и проверяет его", () => {
    const a = hashPassword("long-passphrase-123");
    const b = hashPassword("long-passphrase-123");
    expect(a).not.toBe(b);
    expect(verifyPassword("long-passphrase-123", a)).toBe(true);
    expect(verifyPassword("incorrect", a)).toBe(false);
  });
});
