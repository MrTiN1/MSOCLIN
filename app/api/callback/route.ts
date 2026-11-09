import { NextRequest, after } from "next/server";
import { createBooking } from "@/lib/bookings";
import { notifyBooking } from "@/lib/telegram";
import { assertOrigin, rateLimit, safeError } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    await rateLimit(req, "callback", 8);
    const b = await createBooking(await req.json(), true);
    after(() => notifyBooking(b.id));
    return Response.json(b, { status: 201 });
  } catch (e) {
    return safeError(e);
  }
}
