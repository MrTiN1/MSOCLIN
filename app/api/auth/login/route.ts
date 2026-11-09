import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  assertOrigin,
  rateLimit,
  safeError,
  verifyPassword,
  signSession,
  HttpError,
} from "@/lib/security";
import { z } from "zod";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    await rateLimit(req, "login", 8, 900000);
    const v = z
      .object({
        email: z.email().max(200),
        password: z.string().min(1).max(200),
      })
      .parse(await req.json());
    const user = await db.user.findUnique({
      where: { email: v.email.toLowerCase() },
    });
    if (!user || !verifyPassword(v.password, user.passwordHash))
      throw new HttpError(401, "Неверный email или пароль");
    const r = NextResponse.json({ ok: true });
    r.cookies.set("mos_admin", await signSession(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 28800,
    });
    return r;
  } catch (e) {
    return safeError(e);
  }
}
