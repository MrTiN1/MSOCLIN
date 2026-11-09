import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
const routes = [
  "/",
  "/services",
  "/services/sofa",
  "/calculator",
  "/portfolio",
  "/about",
  "/reviews",
  "/contacts",
  "/booking",
  "/privacy",
  "/admin",
];
test("маршруты, изображения и навигация", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const db = new PrismaClient();
  const slugs = await db.service.findMany({ select: { slug: true } });
  await db.$disconnect();
  for (const route of [...routes, ...slugs.map((s) => "/services/" + s.slug)]) {
    const r = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(r?.status(), route).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(
      await page
        .locator("body")
        .evaluate((el) => el.scrollWidth <= innerWidth + 1),
      route,
    ).toBe(true);
  }
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Основная навигация", exact: true })
    .getByRole("link", { name: "Услуги", exact: true })
    .click();
  await expect(page).toHaveURL(/\/services$/);
  expect(errors).toEqual([]);
});
test("калькулятор учитывает количество и допуслугу", async ({ page }) => {
  await page.goto("/calculator");
  await page.getByRole("button", { name: /Химчистка диванов/ }).click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await page
    .getByLabel("Размер и материал")
    .selectOption({ label: "2 места · Синтетика" });
  await page.getByLabel("Количество предметов").fill("4");
  await page.getByRole("button", { name: "Продолжить" }).click();
  await page.getByText("Сильное загрязнение", { exact: true }).first().click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.locator(".calculator-final .quote-total")).toContainText(
    "7 200 ₽",
  );
  await page.getByRole("link", { name: "Выбрать дату и время" }).click();
  await expect(page).toHaveURL(/\/booking\?/);
});
test("запись сохраняется, администратор подтверждает и отменяет её", async ({
  page,
  request,
}) => {
  await page.goto("/booking");
  await page.getByRole("button", { name: /Химчистка диванов/ }).click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await page
    .getByLabel("Размер и материал")
    .selectOption({ label: "2 места · Синтетика" });
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.locator(".calendar-state")).not.toContainText("Проверяем", {
    timeout: 30000,
  });
  const day = page.locator(".calendar-grid button:not([disabled])").first();
  if ((await day.count()) === 0) {
    await page.getByRole("button", { name: "Следующий месяц" }).click();
    await expect(page.locator(".calendar-state")).not.toContainText(
      "Проверяем",
      { timeout: 30000 },
    );
  }
  await page.locator(".calendar-grid button:not([disabled])").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".time-grid button:not([disabled])").first().click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await page.getByRole("button", { name: "Подтвердить заявку" }).click();
  await expect(page.getByText("Укажите имя", { exact: true })).toBeVisible();
  await page.getByLabel("Ваше имя", { exact: true }).fill("E2E Клиент");
  await page.getByLabel("Телефон", { exact: true }).fill("+7 (999) 111-22-33");
  await page
    .getByLabel("Адрес в Москве или области")
    .fill("Москва, Тестовая улица, дом 1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Подтвердить заявку" }).click();
  await expect(
    page.getByText("ЗАЯВКА СОХРАНЕНА", { exact: true }),
  ).toBeVisible();
  const number = await page.locator(".booking-success p b").textContent();
  expect(number).toMatch(/^MOS-/);
  const db = new PrismaClient();
  try {
    const b = await db.booking.findUniqueOrThrow({
      where: { number: number! },
    });
    expect(b.status).toBe("PENDING");
    expect(
      await db.bookingResourceAllocation.count({
        where: { bookingId: b.id, active: true },
      }),
    ).toBe(1);
    const denied = await request.get("/api/bookings/" + b.id);
    expect(denied.status()).toBe(404);
  } finally {
    await db.$disconnect();
  }
  await page.goto("/admin");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.E2E_ADMIN_EMAIL!);
  await page
    .getByLabel("Пароль", { exact: true })
    .fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Панель управления" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Заявки", exact: true }).click();
  await page.getByRole("button").filter({ hasText: number! }).first().click();
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Статус", exact: true })
    .selectOption("CONFIRMED");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button").filter({ hasText: number! }).first().click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("combobox", { name: "Статус", exact: true }),
  ).toHaveValue("CONFIRMED");
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Статус", exact: true })
    .selectOption("CANCELLED");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const check = new PrismaClient();
  try {
    const b = await check.booking.findUniqueOrThrow({
      where: { number: number! },
    });
    expect(b.status).toBe("CANCELLED");
    expect(
      await check.bookingResourceAllocation.count({
        where: { bookingId: b.id, active: true },
      }),
    ).toBe(0);
  } finally {
    await check.$disconnect();
  }
});
test("CRM и webhook отвергают неавторизованные запросы", async ({
  request,
}) => {
  expect((await request.get("/api/admin")).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin", {
        data: { action: "settings", key: "pricing", value: { minimum: 1 } },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/telegram/webhook", {
        data: { callback_query: { data: "confirm:any" } },
      })
    ).status(),
  ).toBe(401);
});
test("форма обратной связи сохраняет реальную заявку", async ({ page }) => {
  await page.goto("/contacts");
  await page
    .getByLabel("Ваше имя", { exact: true })
    .fill("E2E Обратный звонок");
  await page.getByLabel("Телефон", { exact: true }).fill("+7 (999) 222-33-44");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Оставить заявку", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Заявка принята" }),
  ).toBeVisible();
});
test("адаптивность 320–1920 px и мобильное меню", async ({ page }) => {
  for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/services",
      "/booking",
      "/calculator",
      "/contacts",
      "/admin",
    ]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} при ${width}`,
      ).toBe(true);
    }
    if (width === 390) {
      await page.goto("/");
      await page.screenshot({
        path: "test-results/home-mobile.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: "Открыть меню" }).click();
      await page
        .getByRole("navigation", { name: "Мобильная навигация" })
        .getByRole("link", { name: "Услуги", exact: true })
        .click();
      await expect(page).toHaveURL(/\/services$/);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.waitForTimeout(600);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});
test("CRM сохраняет контент и остаётся доступной на мобильных экранах", async ({
  page,
}) => {
  const cleanup = new PrismaClient();
  await cleanup.fAQ.deleteMany({
    where: { question: "Как работает проверка E2E?" },
  });
  await cleanup.$disconnect();
  await page.goto("/admin");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.E2E_ADMIN_EMAIL!);
  await page
    .getByLabel("Пароль", { exact: true })
    .fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Панель управления" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Контент", exact: true }).click();
  await page
    .getByRole("button", { name: "Вопросы и ответы", exact: true })
    .click();
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await page
    .getByLabel("Вопрос", { exact: true })
    .fill("Как работает проверка E2E?");
  await page
    .getByLabel("Ответ", { exact: true })
    .fill("Это проверка записи контента в отдельной тестовой базе.");
  await page.getByLabel("Опубликовано", { exact: true }).check();
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Изменения сохранены");
  const publicPage = await page.context().newPage();
  await publicPage.goto("/");
  await expect(
    publicPage.getByRole("button", { name: "Как работает проверка E2E?" }),
  ).toBeVisible();
  await publicPage.close();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const name of [
      "Обзор",
      "Заявки",
      "Календарь",
      "Бригады и график",
      "Контент",
      "Настройки",
    ]) {
      await page
        .getByRole("navigation")
        .filter({ has: page.getByRole("button", { name, exact: true }) })
        .getByRole("button", { name, exact: true })
        .click();
      await page.waitForTimeout(120);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${name} при ${width}`,
      ).toBe(true);
    }
  }
  const db = new PrismaClient();
  try {
    await db.fAQ.deleteMany({
      where: { question: "Как работает проверка E2E?" },
    });
  } finally {
    await db.$disconnect();
  }
});
test("календарь, выбор времени и контактная форма на всех контрольных ширинах", async ({
  page,
}) => {
  for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/booking", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Химчистка диванов/ }).click();
    await page.getByRole("button", { name: "Продолжить" }).click();
    await page.getByRole("button", { name: "Продолжить" }).click();
    await expect(page.locator(".calendar-state")).not.toContainText(
      "Проверяем",
      { timeout: 30000 },
    );
    await expect(page.locator(".calendar-grid")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Календарь ${width}`,
    ).toBe(true);
    if (width === 390)
      await page.screenshot({
        path: "test-results/booking-calendar-mobile.png",
        fullPage: true,
      });
    await page.locator(".calendar-grid button:not([disabled])").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.locator(".time-grid button:not([disabled])").first(),
    ).toBeVisible();
    expect(
      await page
        .getByRole("dialog")
        .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      `Время ${width}`,
    ).toBe(true);
    if (width === 390)
      await page.screenshot({ path: "test-results/booking-time-mobile.png" });
    await page.locator(".time-grid button:not([disabled])").first().click();
    await page.getByRole("button", { name: "Продолжить" }).click();
    await expect(
      page.getByLabel("Адрес в Москве или области", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Форма ${width}`,
    ).toBe(true);
  }
});
