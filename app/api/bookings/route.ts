import { NextRequest, after } from "next/server";
import { createBooking } from "@/lib/bookings";
import { notifyBooking } from "@/lib/telegram";
import { assertOrigin, rateLimit, safeError } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    await rateLimit(req, "booking", 10);
    const booking = await createBooking(await req.json());
    after(() => notifyBooking(booking.id));
    return Response.json(booking, { status: 201 });
  } catch (e) {
    return safeError(e);
  }
}
