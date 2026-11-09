import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "../lib/db";
import { createBooking, changeBooking } from "../lib/bookings";
import {
  slotsForDay,
  atMinute,
  moscowDate,
  expireHolds,
} from "../lib/scheduling";
import { addDays, format } from "date-fns";
import { randomBytes, randomUUID } from "crypto";
const day = format(
  addDays(new Date(moscowDate() + "T12:00:00Z"), 3),
  "yyyy-MM-dd",
);
let selection: {
  serviceId: string;
  priceId: string;
  quantity: number;
  extras: [];
};
function input(date = day, minute = 540) {
  return {
    name: "Тестовый клиент",
    phone: "+79990000000",
    address: "Тестовый адрес, дом 1",
    comment: "Тест",
    consent: true,
    website: "",
    selection,
    startsAt: atMinute(date, minute).toISOString(),
    idempotencyKey: randomUUID(),
    accessToken: randomBytes(32).toString("hex"),
  };
}
beforeEach(async () => {
  if (!process.env.DATABASE_URL?.includes("_test"))
    throw Error("Refusing non-test database");
  await db.booking.deleteMany();
  await db.customer.deleteMany();
  await db.scheduleException.deleteMany();
  await db.team.updateMany({ data: { active: true, travelMinutes: 30 } });
  for (const t of await db.team.findMany())
    for (let weekday = 0; weekday < 7; weekday++)
      await db.teamSchedule.upsert({
        where: { teamId_weekday: { teamId: t.id, weekday } },
        create: {
          teamId: t.id,
          weekday,
          startMinute: 540,
          endMinute: 1140,
          breakStart: 780,
          breakEnd: 840,
        },
        update: {
          startMinute: 540,
          endMinute: 1140,
          breakStart: 780,
          breakEnd: 840,
        },
      });
  const s = await db.service.findUniqueOrThrow({
    where: { slug: "sofa" },
    include: { prices: { where: { label: "2 места", material: "synthetic" } } },
  });
  selection = {
    serviceId: s.id,
    priceId: s.prices[0].id,
    quantity: 1,
    extras: [],
  };
});
afterAll(() => db.$disconnect());
describe("Реальный PostgreSQL: ресурсные интервалы", () => {
  it("две бригады принимают две записи на одно время, третья отклоняется", async () => {
    const results = await Promise.allSettled([
      createBooking(input()),
      createBooking(input()),
      createBooking(input()),
    ]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(2);
    const failed = results.find(
      (x) => x.status === "rejected",
    ) as PromiseRejectedResult;
    expect(failed.reason.status).toBe(409);
    expect(
      await db.bookingResourceAllocation.count({ where: { active: true } }),
    ).toBe(2);
  });
  it("одновременная запись на последнюю бригаду: один успех, один конфликт", async () => {
    await db.team.update({ where: { id: "team-2" }, data: { active: false } });
    const results = await Promise.allSettled([
      createBooking(input()),
      createBooking(input()),
    ]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((x) => x.status === "rejected")).toHaveLength(1);
  });
  it("блокирует весь интервал чистки и дороги, а также перерыв", async () => {
    await db.team.update({ where: { id: "team-2" }, data: { active: false } });
    await createBooking(input());
    const slots = await slotsForDay(day, 120);
    expect(slots.find((s) => s.time === "10:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "12:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "14:00")?.available).toBe(true);
  });
  it("после отмены и истечения резерва слот освобождается", async () => {
    await db.team.update({ where: { id: "team-2" }, data: { active: false } });
    const a = await createBooking(input());
    await changeBooking(a.id, { status: "CANCELLED" }, "test-admin");
    expect(
      (await slotsForDay(day, 120)).find((s) => s.time === "09:00")?.available,
    ).toBe(true);
    const b = await createBooking(input());
    await db.booking.update({
      where: { id: b.id },
      data: { holdExpiresAt: new Date(Date.now() - 1000) },
    });
    await db.$transaction(expireHolds);
    expect(
      (await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status,
    ).toBe("EXPIRED");
    expect(
      await db.bookingResourceAllocation.count({ where: { active: true } }),
    ).toBe(0);
  });
  it("переносит запись и бригаду, освобождает предыдущий интервал", async () => {
    const b = await createBooking(input());
    await changeBooking(
      b.id,
      {
        status: "CONFIRMED",
        startsAt: atMinute(day, 840).toISOString(),
        teamId: "team-2",
      },
      "test-admin",
    );
    const rows = await db.bookingResourceAllocation.findMany({
      where: { bookingId: b.id, active: true },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].teamId).toBe("team-2");
    expect(rows[0].startsAt.toISOString()).toBe(
      atMinute(day, 840).toISOString(),
    );
    expect(
      (await db.booking.findUniqueOrThrow({ where: { id: b.id } }))
        .holdExpiresAt,
    ).toBeNull();
  });
  it("учитывает ручную блокировку и отдельный выходной бригады", async () => {
    await db.team.update({ where: { id: "team-2" }, data: { active: false } });
    await db.scheduleException.create({
      data: {
        teamId: "team-1",
        startsAt: atMinute(day, 540),
        endsAt: atMinute(day, 720),
        reason: "Тестовая блокировка",
      },
    });
    expect(
      (await slotsForDay(day, 120)).find((s) => s.time === "09:00")?.available,
    ).toBe(false);
    await db.teamSchedule.delete({
      where: {
        teamId_weekday: {
          teamId: "team-1",
          weekday: new Date(day + "T12:00:00Z").getUTCDay(),
        },
      },
    });
    expect(await slotsForDay(day, 120)).toHaveLength(0);
  });
  it("повторная отправка одного запроса не создаёт вторую заявку", async () => {
    const v = input();
    const a = await createBooking(v),
      b = await createBooking(v);
    expect(a.id).toBe(b.id);
    expect(await db.booking.count()).toBe(1);
  });
  it("ограничение PostgreSQL запрещает пересечение даже вне прикладного кода", async () => {
    const b = await createBooking(input());
    const a = await db.bookingResourceAllocation.findFirstOrThrow({
      where: { bookingId: b.id, active: true },
    });
    await expect(
      db.bookingResourceAllocation.create({
        data: {
          bookingId: b.id,
          teamId: a.teamId,
          startsAt: new Date(a.startsAt.getTime() + 60000),
          endsAt: a.endsAt,
        },
      }),
    ).rejects.toThrow();
  });
});
