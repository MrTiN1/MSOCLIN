import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { randomUUID } from "crypto";
import {
  admin,
  assertOrigin,
  rateLimit,
  safeError,
  HttpError,
} from "@/lib/security";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    if (!(await admin())) throw new HttpError(401, "Войдите в панель");
    await rateLimit(req, "upload", 50);
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new HttpError(
        503,
        "Подключите Vercel Blob для загрузки фотографий",
      );
    if (Number(req.headers.get("content-length") ?? 0) > 6000000)
      throw new HttpError(413, "Максимум 5 МБ");
    const form = await req.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5000000 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new HttpError(400, "Выберите JPG, PNG или WebP до 5 МБ");
    let buffer: Buffer;
    try {
      buffer = await sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 25000000,
      })
        .rotate()
        .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new HttpError(400, "Файл не является допустимым изображением");
    }
    const blob = await put(`portfolio/${randomUUID()}.webp`, buffer, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
    });
    return Response.json({ url: blob.url });
  } catch (e) {
    return safeError(e);
  }
}
