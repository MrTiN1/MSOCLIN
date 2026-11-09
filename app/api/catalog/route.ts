import { db } from "@/lib/db";
import { safeError } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json({
      services: await db.service.findMany({
        where: { active: true },
        include: { prices: true, category: true },
        orderBy: { slug: "asc" },
      }),
    });
  } catch (e) {
    return safeError(e);
  }
}
