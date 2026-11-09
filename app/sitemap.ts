import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { getServices } from "@/lib/catalog";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.APP_URL ?? "http://localhost:3000";
  return [
    "/",
    "/services",
    "/calculator",
    "/portfolio",
    "/about",
    "/reviews",
    "/contacts",
    ...(await getServices()).map((s) => "/services/" + s.slug),
  ].map((p) => ({
    url: url + p,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: p === "/" ? 1 : 0.7,
  }));
}
