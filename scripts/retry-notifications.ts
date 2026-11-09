import "dotenv/config";
import { retryNotifications } from "../lib/telegram";
import { db } from "../lib/db";
retryNotifications()
  .then((n) => console.log("Обработано:", n))
  .finally(() => db.$disconnect());
