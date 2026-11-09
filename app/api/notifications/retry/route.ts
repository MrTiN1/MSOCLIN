import { NextRequest } from "next/server";
import { retryNotifications } from "@/lib/telegram";
export async function GET(req: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ processed: await retryNotifications() });
}
