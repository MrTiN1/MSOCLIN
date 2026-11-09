import "dotenv/config";
import { db } from "../lib/db";
import { hashPassword } from "../lib/security";
async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase(),
    password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 14)
    throw new Error(
      "Задайте ADMIN_EMAIL и ADMIN_PASSWORD (не менее 14 символов) через окружение",
    );
  if (await db.user.findUnique({ where: { email } }))
    throw new Error(
      "Администратор уже существует. Для смены пароля используйте защищённый процесс восстановления.",
    );
  await db.user.create({
    data: { email, passwordHash: hashPassword(password) },
  });
  console.log("Администратор создан");
}
main().finally(() => db.$disconnect());
