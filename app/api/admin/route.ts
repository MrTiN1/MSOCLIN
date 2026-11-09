import { NextRequest, after } from "next/server";
import { notifyBooking } from "@/lib/telegram";
import { db } from "@/lib/db";
import { admin, assertOrigin, safeError, HttpError } from "@/lib/security";
import { changeBooking, createBooking } from "@/lib/bookings";
import { contentModels, saveContent } from "@/lib/admin-content";
import { expireHolds } from "@/lib/scheduling";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const u = await admin();
    if (!u) throw new HttpError(401, "Войдите в панель");
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
      await expireHolds(tx);
    });
    if (req.nextUrl.searchParams.get("view") === "calendar") {
      const from = z.iso
          .datetime({ offset: true })
          .parse(req.nextUrl.searchParams.get("from")),
        to = z.iso
          .datetime({ offset: true })
          .parse(req.nextUrl.searchParams.get("to"));
      if (new Date(to).getTime() - new Date(from).getTime() > 32 * 86400000)
        throw new HttpError(400, "Слишком большой интервал");
      const rows = await db.booking.findMany({
        where: { startsAt: { gte: new Date(from), lt: new Date(to) } },
        include: {
          customer: true,
          items: { include: { service: true } },
          allocations: true,
          history: true,
        },
        orderBy: { startsAt: "asc" },
      });
      return Response.json(
        {
          bookings: rows.map(({ accessTokenHash, idempotencyKey, ...r }) => r),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const offset = Math.max(
      0,
      Number(req.nextUrl.searchParams.get("offset") ?? 0),
    );
    const [bookings, count, teams, settings, groups, revenue] =
      await Promise.all([
        db.booking.findMany({
          skip: offset,
          take: 100,
          orderBy: { createdAt: "desc" },
          include: {
            customer: true,
            items: { include: { service: true } },
            allocations: true,
            history: { orderBy: { createdAt: "desc" } },
          },
        }),
        db.booking.count(),
        db.team.findMany({
          include: { schedules: true, exceptions: true, members: true },
        }),
        db.siteSettings.findMany(),
        db.booking.groupBy({ by: ["status"], _count: true }),
        db.booking.aggregate({
          where: { status: "COMPLETED" },
          _sum: { total: true },
        }),
      ]);
    const content: Record<string, unknown> = {};
    for (const [key, delegate] of Object.entries(contentModels))
      content[key] = await (
        delegate as unknown as { findMany: (v: unknown) => Promise<unknown> }
      ).findMany({ take: 500 });
    return Response.json(
      {
        bookings: bookings.map(
          ({ accessTokenHash, idempotencyKey, ...b }) => b,
        ),
        count,
        teams,
        settings,
        groups,
        revenue: revenue._sum.total ?? 0,
        content,
        notifications: await db.notificationLog.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            bookingId: true,
            status: true,
            attempts: true,
            error: true,
          },
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return safeError(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    const u = await admin();
    if (!u) throw new HttpError(401, "Войдите в панель");
    const body = await req.json();
    if (body.action === "booking") {
      const v = z
        .object({
          id: z.string(),
          data: z.object({
            status: z
              .enum([
                "PENDING",
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
                "EXPIRED",
              ])
              .optional(),
            startsAt: z.iso.datetime({ offset: true }).optional(),
            teamId: z.string().optional(),
            internalComment: z.string().max(4000).optional(),
            selection: z.unknown().optional(),
            total: z.number().int().min(0).max(10000000).optional(),
          }),
        })
        .parse(body);
      return Response.json(await changeBooking(v.id, v.data, u.id));
    }
    if (body.action === "createBooking") {
      const b = await createBooking(body.data);
      await db.auditLog.create({
        data: { actor: u.id, action: "booking.create", entityId: b.id },
      });
      after(() => notifyBooking(b.id));
      return Response.json(b);
    }
    if (body.action === "content")
      return Response.json(
        await saveContent(body.model, body.id, body.data, u.id),
      );
    if (body.action === "settings") {
      const key = z
        .enum(["company", "pricing", "bookingPolicy", "texts"])
        .parse(body.key);
      let value;
      if (key === "pricing")
        value = z
          .object({
            minimum: z.number().int().min(0).max(1000000),
            rules: z.record(
              z.string().max(50),
              z.record(
                z.string().max(50),
                z
                  .object({
                    label: z.string().min(2).max(100),
                    amount: z.number().int().min(0).max(1000000),
                    percent: z.boolean().optional(),
                  })
                  .refine((x) => !x.percent || x.amount <= 100),
              ),
            ),
          })
          .parse(body.value);
      else if (key === "bookingPolicy")
        value = z
          .object({
            holdMinutes: z.number().int().min(5).max(2880),
            slotStepMinutes: z.number().int().min(15).max(120),
            advanceMinutes: z.number().int().min(0).max(10080),
            horizonDays: z.number().int().min(7).max(365),
          })
          .parse(body.value);
      else if (key === "texts")
        value = z
          .record(z.string().max(60), z.string().min(1).max(4000))
          .parse(body.value);
      else
        value = z
          .object({
            name: z.string().max(100),
            phone: z.string().max(50),
            tel: z.string().regex(/^\+\d{10,15}$/),
            email: z.email(),
            address: z.string().max(300),
            hours: z.string().max(100),
            telegram: z.url().startsWith("https://t.me/"),
            vk: z.url().startsWith("https://vk.com/"),
            reviewsUrl: z.url().startsWith("https://"),
            source: z.url().startsWith("https://"),
          })
          .parse(body.value);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
        await tx.siteSettings.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
        await tx.auditLog.create({
          data: { actor: u.id, action: "settings.update", entityId: key },
        });
      });
      return Response.json({ ok: true });
    }
    if (body.action === "team") {
      const v = z
        .object({
          id: z.string().optional(),
          name: z.string().min(2).max(80),
          active: z.boolean(),
          travelMinutes: z.number().int().min(0).max(180),
        })
        .parse(body.data);
      const result = await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
        const t = v.id
          ? await tx.team.update({ where: { id: v.id }, data: v })
          : await tx.team.create({ data: v });
        await tx.auditLog.create({
          data: { actor: u.id, action: "team.save", entityId: t.id },
        });
        return t;
      });
      return Response.json(result);
    }
    if (body.action === "schedule") {
      const v = z
        .object({
          teamId: z.string(),
          weekday: z.number().int().min(0).max(6),
          startMinute: z.number().int().min(0).max(1438),
          endMinute: z.number().int().min(1).max(1439),
          breakStart: z.number().int().min(0).max(1438).nullable(),
          breakEnd: z.number().int().min(1).max(1439).nullable(),
        })
        .refine(
          (v) =>
            v.endMinute > v.startMinute &&
            ((v.breakStart === null && v.breakEnd === null) ||
              (v.breakStart !== null &&
                v.breakEnd !== null &&
                v.breakStart >= v.startMinute &&
                v.breakEnd <= v.endMinute &&
                v.breakEnd > v.breakStart)),
        )
        .parse(body.data);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
        await expireHolds(tx);
        const a = await tx.bookingResourceAllocation.findMany({
          where: { teamId: v.teamId, active: true, endsAt: { gt: new Date() } },
        });
        for (const x of a) {
          const start = new Date(x.startsAt.getTime() + 10800000),
            end = new Date(x.endsAt.getTime() + 10800000);
          if (start.getUTCDay() !== v.weekday) continue;
          const sm = start.getUTCHours() * 60 + start.getUTCMinutes(),
            em = end.getUTCHours() * 60 + end.getUTCMinutes();
          if (
            sm < v.startMinute ||
            em > v.endMinute ||
            (v.breakStart !== null &&
              v.breakEnd !== null &&
              sm < v.breakEnd &&
              em > v.breakStart)
          )
            throw new HttpError(
              409,
              "В расписании есть запись. Сначала перенесите или отмените её",
            );
        }
        await tx.teamSchedule.upsert({
          where: { teamId_weekday: { teamId: v.teamId, weekday: v.weekday } },
          create: v,
          update: v,
        });
        await tx.auditLog.create({
          data: { actor: u.id, action: "schedule.save", entityId: v.teamId },
        });
      });
      return Response.json({ ok: true });
    }
    if (body.action === "exception") {
      const v = z
        .object({
          teamId: z.string(),
          startsAt: z.iso.datetime({ offset: true }),
          endsAt: z.iso.datetime({ offset: true }),
          reason: z.string().min(2).max(200),
        })
        .refine((x) => x.endsAt > x.startsAt)
        .parse(body.data);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
        await expireHolds(tx);
        const conflict = await tx.bookingResourceAllocation.findFirst({
          where: {
            teamId: v.teamId,
            active: true,
            startsAt: { lt: new Date(v.endsAt) },
            endsAt: { gt: new Date(v.startsAt) },
          },
        });
        if (conflict)
          throw new HttpError(
            409,
            "В интервале есть запись. Сначала перенесите или отмените её",
          );
        await tx.scheduleException.create({ data: v });
        await tx.auditLog.create({
          data: { actor: u.id, action: "schedule.block", entityId: v.teamId },
        });
      });
      return Response.json({ ok: true });
    }
    if (body.action === "deleteSchedule") {
      const v = z
        .object({ teamId: z.string(), weekday: z.number().int().min(0).max(6) })
        .parse(body.data);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
        await expireHolds(tx);
        const rows = await tx.bookingResourceAllocation.findMany({
          where: { teamId: v.teamId, active: true, endsAt: { gt: new Date() } },
        });
        if (
          rows.some(
            (r) =>
              new Date(r.startsAt.getTime() + 10800000).getUTCDay() ===
              v.weekday,
          )
        )
          throw new HttpError(
            409,
            "Сначала перенесите записи в этот день недели",
          );
        await tx.teamSchedule.deleteMany({ where: v });
        await tx.auditLog.create({
          data: { actor: u.id, action: "schedule.dayoff", entityId: v.teamId },
        });
      });
      return Response.json({ ok: true });
    }
    if (body.action === "deleteException") {
      const id = z.string().parse(body.id);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
        await tx.scheduleException.delete({ where: { id } });
        await tx.auditLog.create({
          data: { actor: u.id, action: "schedule.unblock", entityId: id },
        });
      });
      return Response.json({ ok: true });
    }
    throw new HttpError(400, "Неизвестное действие");
  } catch (e) {
    return safeError(e);
  }
}
