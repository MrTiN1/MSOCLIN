import { db } from "./db";
import { bookingSchema, callbackSchema } from "./validation";
import { getQuote } from "./pricing";
import { availableTeams, expireHolds, policy, moscowDate } from "./scheduling";
import { hash, HttpError } from "./security";
import { randomBytes } from "crypto";
import type { BookingStatus } from "@prisma/client";
export async function createBooking(input: unknown, callback = false) {
  const value = callback
    ? callbackSchema.parse(input)
    : bookingSchema.parse(input);
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
      await expireHolds(tx);
      const previous = await tx.booking.findUnique({
        where: { idempotencyKey: value.idempotencyKey },
      });
      if (previous) {
        if (previous.accessTokenHash !== hash(value.accessToken))
          throw new HttpError(409, "Повторите отправку");
        return {
          id: previous.id,
          number: previous.number,
          status: previous.status,
        };
      }
      const full = callback ? null : bookingSchema.parse(input);
      const selection = full?.selection ?? null;
      const quote = selection
        ? await getQuote(selection, tx as typeof db)
        : null;
      const start = full ? new Date(full.startsAt) : null;
      const teams =
        start && quote
          ? await availableTeams(
              moscowDate(start),
              start,
              quote.durationMinutes,
              tx,
            )
          : [];
      if (start && !teams.length)
        throw new HttpError(409, "Это время уже занято. Выберите другое");
      const p = await policy(tx);
      const booking = await tx.booking.create({
        data: {
          number: "MOS-" + randomBytes(5).toString("hex").toUpperCase(),
          customer: { create: { name: value.name, phone: value.phone } },
          address: value.address,
          comment: value.comment,
          total: quote?.total ?? 0,
          quote: quote ? JSON.parse(JSON.stringify(quote)) : { callback: true },
          startsAt: start,
          endsAt:
            start && quote
              ? new Date(start.getTime() + quote.durationMinutes * 60000)
              : null,
          holdExpiresAt: start
            ? new Date(Date.now() + p.holdMinutes * 60000)
            : null,
          idempotencyKey: value.idempotencyKey,
          accessTokenHash: hash(value.accessToken),
          items:
            selection && quote
              ? {
                  create: {
                    serviceId: selection.serviceId,
                    quantity: selection.quantity,
                    unitPrice: quote.base / selection.quantity,
                    parameters: JSON.parse(JSON.stringify(selection)),
                  },
                }
              : undefined,
          allocations:
            teams[0] && start
              ? {
                  create: {
                    teamId: teams[0].id,
                    startsAt: start,
                    endsAt: teams[0].end,
                  },
                }
              : undefined,
          history: { create: { status: "PENDING", actor: "customer" } },
          notifications: { create: { status: "PENDING" } },
        },
      });
      return { id: booking.id, number: booking.number, status: booking.status };
    },
    { timeout: 20000 },
  );
}
const transitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};
export async function changeBooking(
  id: string,
  data: {
    status?: BookingStatus;
    startsAt?: string;
    teamId?: string;
    internalComment?: string;
    selection?: unknown;
    total?: number;
  },
  actor: string,
) {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
      await expireHolds(tx);
      const b = await tx.booking.findUniqueOrThrow({
        where: { id },
        include: { allocations: true, items: true },
      });
      const target = data.status ?? b.status;
      if (target !== b.status && !transitions[b.status].includes(target))
        throw new HttpError(409, "Этот переход статуса недоступен");
      if (
        ["CANCELLED", "EXPIRED", "COMPLETED"].includes(b.status) &&
        (data.startsAt || data.teamId || data.selection)
      )
        throw new HttpError(409, "Закрытый заказ нельзя перенести");
      const quote = data.selection
        ? await getQuote(data.selection, tx as typeof db)
        : (b.quote as { durationMinutes?: number });
      const start = data.startsAt ? new Date(data.startsAt) : b.startsAt;
      if ((data.startsAt || data.teamId || data.selection) && start) {
        const duration = quote.durationMinutes ?? 120;
        const teams = await availableTeams(
          moscowDate(start),
          start,
          duration,
          tx,
          id,
        );
        const selected = data.teamId
          ? teams.find((t) => t.id === data.teamId)
          : teams[0];
        if (!selected)
          throw new HttpError(409, "Это время уже занято. Выберите другое");
        await tx.bookingResourceAllocation.updateMany({
          where: { bookingId: id },
          data: { active: false },
        });
        await tx.bookingResourceAllocation.create({
          data: {
            bookingId: id,
            teamId: selected.id,
            startsAt: start,
            endsAt: selected.end,
          },
        });
        await tx.booking.update({
          where: { id },
          data: {
            startsAt: start,
            endsAt: new Date(start.getTime() + duration * 60000),
            holdExpiresAt:
              b.status === "PENDING"
                ? new Date(Date.now() + (await policy(tx)).holdMinutes * 60000)
                : null,
          },
        });
      }
      if (data.selection) {
        const s = bookingSchema.shape.selection.parse(data.selection);
        const q = await getQuote(s, tx as typeof db);
        await tx.bookingItem.deleteMany({ where: { bookingId: id } });
        await tx.bookingItem.create({
          data: {
            bookingId: id,
            serviceId: s.serviceId,
            quantity: s.quantity,
            unitPrice: q.base / s.quantity,
            parameters: s,
          },
        });
        await tx.booking.update({
          where: { id },
          data: { total: q.total, quote: JSON.parse(JSON.stringify(q)) },
        });
      }
      if (["CANCELLED", "COMPLETED"].includes(target))
        await tx.bookingResourceAllocation.updateMany({
          where: { bookingId: id },
          data: { active: false },
        });
      await tx.booking.update({
        where: { id },
        data: {
          status: target,
          holdExpiresAt: target === "CONFIRMED" ? null : undefined,
          internalComment: data.internalComment,
          total: data.total,
        },
      });
      if (target !== b.status)
        await tx.bookingStatusHistory.create({
          data: { bookingId: id, status: target, actor },
        });
      await tx.auditLog.create({
        data: {
          actor,
          action: "booking.update",
          entityId: id,
          details: JSON.parse(JSON.stringify(data)),
        },
      });
      return { id, status: target };
    },
    { timeout: 20000 },
  );
}
