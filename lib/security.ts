import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import { NextRequest } from "next/server";
import { allowedRequestOrigins } from "./request-origin";
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password: string, stored: string) {
  try {
    const [salt, key] = stored.split(":");
    const a = Buffer.from(key, "hex"),
      b = scryptSync(password, salt, 64);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
function secret() {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)
    throw new Error("AUTH_SECRET не настроен");
  return new TextEncoder().encode(process.env.AUTH_SECRET);
}
export async function signSession(user: {
  id: string;
  sessionVersion: number;
}) {
  return new SignJWT({ v: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}
export async function admin() {
  try {
    const token = (await cookies()).get("mos_admin")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    const u = await db.user.findUnique({ where: { id: payload.sub } });
    return u?.role === "ADMIN" && u.sessionVersion === payload.v
      ? { id: u.id, email: u.email }
      : null;
  } catch {
    return null;
  }
}
export function assertOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (process.env.NODE_ENV === "production" && !process.env.APP_URL)
    throw new HttpError(503, "Адрес приложения не настроен");
  const expected = allowedRequestOrigins(
    process.env,
    `${req.nextUrl.protocol}//${req.headers.get("host")}`,
  );
  if (!origin || !expected.includes(origin))
    throw new HttpError(403, "Запрос отклонён. Обновите страницу");
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function rateLimit(
  req: NextRequest,
  scope: string,
  limit = 15,
  windowMs = 3600000,
) {
  // TRUST_PROXY only on a deployment which overwrites incoming x-forwarded-for (Vercel).
  const ip =
    process.env.TRUST_PROXY === "true"
      ? (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown")
      : "local";
  const key = hash(`${scope}:${ip}`);
  const rows = await db.$queryRaw<
    { hits: number }[]
  >`INSERT INTO "RateLimit" ("key","hits","resetAt") VALUES (${key},1,${new Date(Date.now() + windowMs)}) ON CONFLICT ("key") DO UPDATE SET "hits"=CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit"."hits"+1 END, "resetAt"=CASE WHEN "RateLimit"."resetAt" < NOW() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END RETURNING "hits"`;
  if (rows[0].hits > limit)
    throw new HttpError(429, "Слишком много запросов. Попробуйте позднее");
}
export function safeError(e: unknown) {
  if (e instanceof HttpError)
    return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof Error && e.name === "ZodError")
    return Response.json(
      { error: "Проверьте заполненные поля" },
      { status: 400 },
    );
  console.error("Request failed:", e instanceof Error ? e.name : "unknown");
  return Response.json(
    {
      error:
        "Не удалось выполнить запрос. Попробуйте ещё раз или позвоните нам",
    },
    { status: 503 },
  );
}
