import { NextRequest } from "next/server";
import { expireHolds } from "@/lib/scheduling";
import { db } from "@/lib/db";
import { hash, rateLimit, safeError, HttpError } from "@/lib/security";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await rateLimit(req, "booking-status", 100);
    const { id } = await params;
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7248301)`;
      await expireHolds(tx);
    });
    const token =
      req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
    const b = await db.booking.findUnique({
      where: { id },
      select: {
        number: true,
        status: true,
        startsAt: true,
        holdExpiresAt: true,
        accessTokenHash: true,
      },
    });
    if (!b || hash(token) !== b.accessTokenHash)
      throw new HttpError(404, "Заявка не найдена");
    return Response.json(
      {
        number: b.number,
        status: b.status,
        startsAt: b.startsAt,
        holdExpiresAt: b.holdExpiresAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return safeError(e);
  }
}
