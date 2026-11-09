import { NextRequest, NextResponse } from "next/server";
import { assertOrigin, admin, safeError } from "@/lib/security";
import { db } from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    const u = await admin();
    if (u)
      await db.user.update({
        where: { id: u.id },
        data: { sessionVersion: { increment: 1 } },
      });
    const r = NextResponse.json({ ok: true });
    r.cookies.delete("mos_admin");
    return r;
  } catch (e) {
    return safeError(e);
  }
}
