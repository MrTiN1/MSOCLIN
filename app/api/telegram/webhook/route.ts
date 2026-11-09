import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { changeBooking } from "@/lib/bookings";
export async function POST(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const actual = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (
    !expected ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const v = await req.json();
  const c = v.callback_query;
  const allowed = (process.env.TELEGRAM_ADMIN_IDS ?? "").split(",");
  if (
    !c ||
    String(c.message?.chat?.id) !== process.env.TELEGRAM_CHAT_ID ||
    !allowed.includes(String(c.from?.id))
  )
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const [action, id] = String(c.data).split(":");
  let text = "Недоступная команда";
  if (["confirm", "cancel"].includes(action) && /^[a-z0-9]{20,32}$/.test(id))
    try {
      await changeBooking(
        id,
        { status: action === "confirm" ? "CONFIRMED" : "CANCELLED" },
        "telegram:" + c.from.id,
      );
      text = action === "confirm" ? "Запись подтверждена" : "Запись отменена";
    } catch {
      text = "Статус изменился. Откройте заказ в CRM";
    }
  if (process.env.TELEGRAM_BOT_TOKEN)
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: c.id, text }),
        signal: AbortSignal.timeout(6000),
      },
    ).catch(() => {});
  return Response.json({ ok: true });
}
