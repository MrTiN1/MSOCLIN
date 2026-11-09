import { NextRequest } from "next/server";
import { getQuote } from "@/lib/pricing";
import { safeError, rateLimit } from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    await rateLimit(req, "quote", 300);
    return Response.json(await getQuote(await req.json()));
  } catch (e) {
    return safeError(e);
  }
}
