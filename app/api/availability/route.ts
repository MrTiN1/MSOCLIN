import { addDays, format } from "date-fns";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getQuote } from "@/lib/pricing";
import { slotsForDay, expireHolds, policy, moscowDate } from "@/lib/scheduling";
import { safeError, rateLimit, HttpError } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    await rateLimit(req, "availability", 500);
    const body = await req.json();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date))
      throw new HttpError(400, "Выберите дату");
    const quote = await getQuote(body.selection);
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
      await expireHolds(tx);
    });
    if (body.month) {
      const year = Number(body.date.slice(0, 4)),
        month = Number(body.date.slice(5, 7));
      const days = new Date(year, month, 0).getDate();
      const available: Record<string, boolean> = {};
      for (let n = 1; n <= days; n++) {
        const date = `${year}-${String(month).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
        available[date] = (await slotsForDay(date, quote.durationMinutes)).some(
          (s) => s.available,
        );
      }
      return Response.json(
        {
          days: available,
          horizonDate: format(
            addDays(
              new Date(moscowDate() + "T12:00:00Z"),
              (await policy()).horizonDays,
            ),
            "yyyy-MM-dd",
          ),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      { slots: await slotsForDay(body.date, quote.durationMinutes) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return safeError(e);
  }
}
