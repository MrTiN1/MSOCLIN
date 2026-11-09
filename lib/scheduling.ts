import { db } from "./db";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { addDays, format } from "date-fns";
import type { Prisma } from "@prisma/client";
export const TZ = "Europe/Moscow";
export type Tx = Prisma.TransactionClient;
export function moscowDate(d = new Date()) {
  return formatInTimeZone(d, TZ, "yyyy-MM-dd");
}
export function atMinute(day: string, minute: number) {
  return fromZonedTime(
    `${day}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00`,
    TZ,
  );
}
export function overlaps(a: Date, b: Date, c: Date, d: Date) {
  return a < d && b > c;
}
export async function policy(client: Tx = db) {
  const p = await client.siteSettings.findUnique({
    where: { key: "bookingPolicy" },
  });
  return {
    holdMinutes: 120,
    slotStepMinutes: 60,
    advanceMinutes: 60,
    horizonDays: 90,
    ...(p?.value as object),
  };
}
export async function expireHolds(tx: Tx) {
  const rows = await tx.booking.findMany({
    where: { status: "PENDING", holdExpiresAt: { lte: new Date() } },
    select: { id: true },
  });
  if (!rows.length) return;
  const ids = rows.map((x) => x.id);
  await tx.bookingResourceAllocation.updateMany({
    where: { bookingId: { in: ids } },
    data: { active: false },
  });
  await tx.booking.updateMany({
    where: { id: { in: ids } },
    data: { status: "EXPIRED" },
  });
  await tx.bookingStatusHistory.createMany({
    data: ids.map((bookingId) => ({
      bookingId,
      status: "EXPIRED",
      actor: "system",
    })),
  });
}
export async function loadAvailability(
  firstDay: string,
  lastDay = firstDay,
  client: Tx = db,
) {
  const now = new Date();
  const range = {
    startsAt: {
      lt: new Date(atMinute(lastDay, 0).getTime() + 86400000),
    },
    endsAt: { gt: atMinute(firstDay, 0) },
  };
  const [settings, teams] = await Promise.all([
    policy(client),
    client.team.findMany({
      where: { active: true },
      include: {
        schedules: true,
        exceptions: { where: range },
        allocations: {
          where: {
            ...range,
            active: true,
            booking: {
              OR: [
                { status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
                {
                  status: "PENDING",
                  OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now } }],
                },
              ],
            },
          },
          select: { bookingId: true, startsAt: true, endsAt: true },
        },
      },
    }),
  ]);
  return { settings, teams, now };
}
type Availability = Awaited<ReturnType<typeof loadAvailability>>;
export async function availableTeams(
  day: string,
  start: Date,
  duration: number,
  client: Tx = db,
  ignoreBookingId?: string,
  snapshot?: Availability,
) {
  const {
    settings: p,
    now,
    teams,
  } = snapshot ?? (await loadAvailability(day, day, client));
  const maxDay = format(
    addDays(new Date(moscowDate(now) + "T12:00:00Z"), p.horizonDays),
    "yyyy-MM-dd",
  );
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    day < moscowDate(now) ||
    day > maxDay ||
    start.getTime() < now.getTime() + p.advanceMinutes * 60000
  )
    return [];
  const weekday = new Date(day + "T12:00:00Z").getUTCDay();
  const startMin =
    Number(formatInTimeZone(start, TZ, "H")) * 60 +
    Number(formatInTimeZone(start, TZ, "m"));
  if (
    moscowDate(start) !== day ||
    start.getUTCSeconds() ||
    start.getUTCMilliseconds()
  )
    return [];
  const free = [];
  for (const team of teams) {
    const s = team.schedules.find((schedule) => schedule.weekday === weekday);
    if (
      !s ||
      startMin < s.startMinute ||
      (startMin - s.startMinute) % p.slotStepMinutes !== 0
    )
      continue;
    const endMinute = startMin + duration + team.travelMinutes;
    const end = new Date(
      start.getTime() + (duration + team.travelMinutes) * 60000,
    );
    if (
      endMinute > s.endMinute ||
      (s.breakStart !== null &&
        s.breakEnd !== null &&
        startMin < s.breakEnd &&
        endMinute > s.breakStart)
    )
      continue;
    if (team.exceptions.some((e) => overlaps(start, end, e.startsAt, e.endsAt)))
      continue;
    const conflict = team.allocations.some(
      (allocation) =>
        allocation.bookingId !== ignoreBookingId &&
        overlaps(start, end, allocation.startsAt, allocation.endsAt),
    );
    if (!conflict)
      free.push({ id: team.id, end, travelMinutes: team.travelMinutes });
  }
  return free;
}
export async function slotsForDay(
  day: string,
  duration: number,
  snapshot?: Availability,
) {
  const availability = snapshot ?? (await loadAvailability(day));
  const p = availability.settings;
  const weekday = new Date(day + "T12:00:00Z").getUTCDay();
  const schedules = availability.teams.flatMap((team) =>
    team.schedules.filter((schedule) => schedule.weekday === weekday),
  );
  const starts = new Set<number>();
  for (const s of schedules)
    for (let m = s.startMinute; m < s.endMinute; m += p.slotStepMinutes)
      starts.add(m);
  const slots = [];
  for (const m of [...starts].sort((a, b) => a - b)) {
    const start = atMinute(day, m);
    const free = await availableTeams(
      day,
      start,
      duration,
      db,
      undefined,
      availability,
    );
    slots.push({
      time: formatInTimeZone(start, TZ, "HH:mm"),
      startsAt: start.toISOString(),
      available: free.length > 0,
    });
  }
  return slots;
}
