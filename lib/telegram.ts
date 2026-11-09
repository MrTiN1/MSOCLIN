import { db } from "./db";
import { statuses, money } from "./data";
import { formatInTimeZone } from "date-fns-tz";
export async function notifyBooking(id: string) {
  const log = await db.notificationLog.findFirst({
    where: {
      bookingId: id,
      status: { in: ["PENDING", "RETRY", "UNCONFIGURED"] },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!log) return;
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    await db.notificationLog.update({
      where: { id: log.id },
      data: { status: "UNCONFIGURED", error: "Telegram не настроен" },
    });
    return;
  }
  const claimed = await db.notificationLog.updateMany({
    where: { id: log.id, status: log.status },
    data: { status: "SENDING", attempts: { increment: 1 } },
  });
  if (!claimed.count) return;
  const b = await db.booking.findUniqueOrThrow({
    where: { id },
    include: { customer: true, items: { include: { service: true } } },
  });
  try {
    const text = [
      "Новая запись — МОС ХИМЧИСТКА",
      `Клиент: ${b.customer.name}`,
      `Телефон: +${b.customer.phone}`,
      `Услуга: ${b.items.map((i) => i.service.title).join(", ") || "Обратный звонок"}`,
      `Дата и время: ${b.startsAt ? formatInTimeZone(b.startsAt, "Europe/Moscow", "dd.MM.yyyy HH:mm") : "По согласованию"}`,
      `Стоимость: ${b.total ? money(b.total) + " (предварительно)" : "После консультации"}`,
      `Адрес: ${b.address}`,
      `Статус: ${statuses[b.status]}`,
      `Заявка: ${b.number}`,
    ].join("\n");
    const buttons: Record<string, string>[][] = [
      [
        { text: "Подтвердить", callback_data: `confirm:${id}` },
        { text: "Отклонить", callback_data: `cancel:${id}` },
      ],
    ];
    if (process.env.APP_URL?.startsWith("https://"))
      buttons.push([
        {
          text: "Открыть заказ",
          url: `${process.env.APP_URL}/admin?booking=${id}`,
        },
      ]);
    const r = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text,
          reply_markup: { inline_keyboard: buttons },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    const result = await r.json();
    if (!r.ok || !result.ok) throw new Error("Delivery failed");
    await db.notificationLog.update({
      where: { id: log.id },
      data: { status: "SENT", error: null },
    });
  } catch {
    await db.notificationLog.update({
      where: { id: log.id },
      data: { status: "RETRY", error: "Ошибка доставки в Telegram" },
    });
  }
}
export async function retryNotifications() {
  await db.notificationLog.updateMany({
    where: {
      status: "SENDING",
      updatedAt: { lt: new Date(Date.now() - 600000) },
    },
    data: { status: "RETRY" },
  });
  const logs = await db.notificationLog.findMany({
    where: {
      status: { in: ["PENDING", "RETRY", "UNCONFIGURED"] },
      attempts: { lt: 10 },
    },
    take: 30,
  });
  for (const l of logs) await notifyBooking(l.bookingId);
  return logs.length;
}
