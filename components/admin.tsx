"use client";
import { useCallback, useEffect, useState } from "react";
import {
  format,
  addDays,
  startOfWeek,
  startOfMonth,
  getDaysInMonth,
  addMonths,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { ru } from "date-fns/locale";
import {
  LockKeyhole,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Users,
  Files,
  Settings,
  Plus,
  ArrowUpRight,
  Check,
  LoaderCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { money, statuses, materialNames } from "@/lib/data";
import type { ServiceDTO } from "@/lib/catalog";
import { BookingWizard } from "./booking";
import { allowedExtras, extraTitles } from "./calculator";
type Row = Record<string, unknown>;
type Booking = {
  id: string;
  number: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  address: string;
  comment: string;
  internalComment: string;
  total: number;
  customer: { name: string; phone: string };
  items: {
    serviceId: string;
    parameters: {
      serviceId: string;
      priceId: string;
      quantity: number;
      extras: string[];
    };
    service: { title: string };
  }[];
  allocations: { teamId: string; active: boolean }[];
  history: { status: string; actor: string; createdAt: string }[];
};
type Schedule = {
  id: string;
  teamId: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  breakStart: number | null;
  breakEnd: number | null;
};
type Team = {
  id: string;
  name: string;
  active: boolean;
  travelMinutes: number;
  schedules: Schedule[];
  exceptions: {
    id: string;
    startsAt: string;
    endsAt: string;
    reason: string;
  }[];
};
type AdminData = {
  bookings: Booking[];
  count: number;
  teams: Team[];
  settings: { key: string; value: Row }[];
  content: Record<string, Row[]>;
  groups: { status: string; _count: number }[];
  revenue: number;
  notifications: {
    id: string;
    bookingId: string;
    status: string;
    attempts: number;
    error: string | null;
  }[];
};
const labels: Record<string, string> = {
  heroLine1: "Заголовок: строка 1",
  heroLine2: "Заголовок: строка 2",
  heroAccent: "Заголовок: акцент",
  heroDescription: "Описание первого экрана",
  aboutTitle: "Заголовок блока о компании",
  aboutDescription: "Текст блока о компании",
  question: "Вопрос",
  answer: "Ответ",
  position: "Порядок",
  published: "Опубликовано",
  title: "Заголовок",
  description: "Описание",
  sourceUrl: "Ссылка на источник",
  active: "Активно",
  author: "Автор",
  text: "Текст отзыва",
  rating: "Оценка",
  source: "Площадка",
  verified: "Источник проверен",
  category: "Категория",
  beforeImage: "Фото до",
  afterImage: "Фото после",
  rightsConfirmed: "Права и согласие на обе фотографии подтверждены",
  slug: "Адрес страницы (slug)",
  image: "Изображение",
  categoryId: "Категория",
  durationMinutes: "Длительность, минут",
  serviceId: "Услуга",
  label: "Название варианта",
  material: "Материал",
  amount: "Цена, ₽",
  unit: "Единица (item / m2 / quote)",
  preliminary: "Предварительная цена",
  name: "Название",
  minimum: "Минимальный выезд, ₽",
  holdMinutes: "Срок резерва, минут",
  slotStepMinutes: "Шаг начала записи, минут",
  advanceMinutes: "Минимум до выезда, минут",
  horizonDays: "Горизонт записи, дней",
  phone: "Телефон для показа",
  tel: "Телефон для звонка",
  email: "Email",
  address: "Адрес офиса",
  hours: "Режим работы",
  telegram: "Telegram",
  vk: "ВКонтакте",
  reviewsUrl: "Ссылка на отзывы",
};
const templates: Record<string, Row> = {
  FAQ: { question: "", answer: "", position: 0, published: false },
  Promotion: {
    title: "",
    description: "",
    sourceUrl: "https://mos-drycleaning.ru/discounts/",
    active: false,
  },
  Review: {
    author: "",
    text: "",
    rating: 5,
    sourceUrl: "https://",
    source: "Яндекс Карты",
    verified: false,
    published: false,
  },
  PortfolioItem: {
    title: "",
    category: "Диваны",
    beforeImage: "",
    afterImage: "",
    description: "",
    rightsConfirmed: false,
    published: false,
    sourceUrl: null,
  },
  Service: {
    slug: "",
    title: "",
    description: "",
    image: "/images/sofa.jpg",
    sourceUrl: "https://mos-drycleaning.ru/",
    categoryId: "",
    durationMinutes: 120,
    active: false,
  },
  ServicePrice: {
    serviceId: "",
    label: "",
    material: "synthetic",
    amount: 0,
    unit: "item",
    preliminary: true,
  },
  ServiceCategory: { name: "", slug: "" },
};
const modelNames: Record<string, string> = {
  FAQ: "Вопросы и ответы",
  Promotion: "Акции",
  Review: "Отзывы",
  PortfolioItem: "Портфолио",
  Service: "Услуги",
  ServicePrice: "Цены",
  ServiceCategory: "Категории",
};
async function request(body: unknown) {
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}
function localTime(d: string) {
  return formatInTimeZone(new Date(d), "Europe/Moscow", "yyyy-MM-dd'T'HH:mm");
}
function minuteTime(v: number | null) {
  return v === null
    ? ""
    : `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}
function toMinute(v: string) {
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}
export function AdminApp({ authenticated }: { authenticated: boolean }) {
  const [logged, setLogged] = useState(authenticated),
    [data, setData] = useState<AdminData | null>(null),
    [tab, setTab] = useState("overview"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(false),
    [offset, setOffset] = useState(0),
    [detail, setDetail] = useState<Booking | null>(null),
    [newBooking, setNewBooking] = useState(false),
    [loginBusy, setLoginBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin?offset=" + offset);
      if (r.status === 401) {
        setLogged(false);
        return;
      }
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [offset]);
  useEffect(() => {
    if (logged) load();
  }, [logged, load]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(f)),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setLogged(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoginBusy(false);
    }
  }
  async function mutate(body: unknown) {
    setError("");
    setNotice("");
    try {
      await request(body);
      setNotice("Изменения сохранены");
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  const services = (data?.content.Service ?? []).map((s) => ({
    ...s,
    prices: (data?.content.ServicePrice ?? []).filter(
      (p) => p.serviceId === s.id,
    ),
    category: (data?.content.ServiceCategory ?? []).find(
      (c) => c.id === s.categoryId,
    ),
  })) as unknown as ServiceDTO[];
  if (!logged)
    return (
      <div className="admin-login">
        <span className="login-lock">
          <LockKeyhole size={25} />
        </span>
        <span className="eyebrow">МОС ХИМЧИСТКА · CRM</span>
        <h1>Вход для сотрудников</h1>
        <p>Используйте учётную запись администратора.</p>
        <form className="form-stack" onSubmit={login}>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          <Button disabled={loginBusy}>
            {loginBusy && <LoaderCircle className="spin" size={17} />}Войти
            <ArrowUpRight size={17} />
          </Button>
        </form>
        <p className="small">
          Доступ создаётся владельцем сервиса. Публичной регистрации нет.
        </p>
      </div>
    );
  const tabs = [
    ["overview", "Обзор", LayoutDashboard],
    ["orders", "Заявки", ClipboardList],
    ["calendar", "Календарь", CalendarDays],
    ["schedule", "Бригады и график", Users],
    ["content", "Контент", Files],
    ["settings", "Настройки", Settings],
  ] as const;
  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <span className="eyebrow">МОС ХИМЧИСТКА · CRM</span>
          <h1>Панель управления</h1>
        </div>
        <div className="admin-actions">
          <Button size="sm" onClick={() => setNewBooking(true)}>
            <Plus size={16} />
            Новая запись
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            aria-label="Обновить"
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              setLogged(false);
              setData(null);
            }}
          >
            <LogOut size={16} />
            Выйти
          </Button>
        </div>
      </div>
      <nav className="admin-tabs">
        {tabs.map(([id, t, I]) => (
          <button
            className={tab === id ? "active" : ""}
            key={id}
            onClick={() => {
              setTab(id);
              setError("");
              setNotice("");
            }}
          >
            <I size={16} />
            {t}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="admin-notice">
          <Check size={16} />
          {notice}
        </p>
      )}
      {!data ? (
        <div className="empty-state">
          <LoaderCircle className="spin" />
          <p>Загружаем CRM…</p>
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <>
              <div className="stats-grid">
                {["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].map(
                  (status) => (
                    <article key={status}>
                      <span>{statuses[status]}</span>
                      <strong>
                        {data.groups.find((g) => g.status === status)?._count ??
                          0}
                      </strong>
                    </article>
                  ),
                )}
                <article className="revenue-stat">
                  <span>Выручка по выполненным</span>
                  <strong>{money(data.revenue)}</strong>
                </article>
              </div>
              <div className="admin-columns">
                <section className="admin-panel">
                  <h2>Предстоящие записи</h2>
                  <OrderList
                    bookings={data.bookings
                      .filter(
                        (b) =>
                          b.startsAt &&
                          b.startsAt > new Date().toISOString() &&
                          ["PENDING", "CONFIRMED"].includes(b.status),
                      )
                      .sort((a, b) =>
                        (a.startsAt ?? "").localeCompare(b.startsAt ?? ""),
                      )
                      .slice(0, 7)}
                    onSelect={setDetail}
                  />
                </section>
                <section className="admin-panel">
                  <h2>Загруженность бригад</h2>
                  {data.teams.map((t) => (
                    <div key={t.id} className="team-load">
                      <div>
                        <b>{t.name}</b>
                        <small>
                          {t.active ? "Принимает записи" : "Неактивна"}
                        </small>
                      </div>
                      <strong>
                        {
                          data.bookings.filter((b) =>
                            b.allocations.some(
                              (a) => a.active && a.teamId === t.id,
                            ),
                          ).length
                        }
                        <small>активных</small>
                      </strong>
                    </div>
                  ))}
                  <h3 className="notification-title">Уведомления</h3>
                  {data.notifications
                    .filter((n) => n.status !== "SENT")
                    .slice(0, 4)
                    .map((n) => (
                      <p className="notification-line" key={n.id}>
                        {n.status === "UNCONFIGURED"
                          ? "Telegram не настроен"
                          : n.status === "RETRY"
                            ? "Ожидает повторной отправки"
                            : n.status}{" "}
                        · попыток {n.attempts}
                      </p>
                    ))}
                </section>
              </div>
            </>
          )}
          {tab === "orders" && (
            <section className="admin-panel">
              <div className="section-head">
                <h2>
                  Заявки <span className="muted">{data.count}</span>
                </h2>
                <span className="small muted">Москва · МСК</span>
              </div>
              <OrderList bookings={data.bookings} onSelect={setDetail} />
              <div className="pagination">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - 100))}
                >
                  <ChevronLeft size={16} />
                  Назад
                </Button>
                <span>
                  {Math.min(offset + 1, data.count)}–
                  {Math.min(offset + 100, data.count)} из {data.count}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offset + 100 >= data.count}
                  onClick={() => setOffset(offset + 100)}
                >
                  Далее
                  <ChevronRight size={16} />
                </Button>
              </div>
            </section>
          )}
          {tab === "calendar" && (
            <AdminCalendar bookings={data.bookings} onSelect={setDetail} />
          )}
          {tab === "schedule" && (
            <ScheduleEditor teams={data.teams} mutate={mutate} />
          )}
          {tab === "content" && <ContentEditor data={data} mutate={mutate} />}
          {tab === "settings" && (
            <div className="admin-columns">
              {data.settings.map((s) => (
                <SettingsEditor key={s.key} setting={s} mutate={mutate} />
              ))}
            </div>
          )}
          <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
            <DialogContent className="order-dialog">
              <DialogTitle>Заявка {detail?.number}</DialogTitle>
              <DialogDescription>
                Данные клиента доступны только сотрудникам.
              </DialogDescription>
              {detail && (
                <OrderEditor
                  key={detail.id}
                  booking={detail}
                  teams={data.teams}
                  services={services}
                  onSave={async (body) => {
                    if (await mutate(body)) setDetail(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={newBooking} onOpenChange={setNewBooking}>
            <DialogContent className="new-booking-dialog">
              <DialogTitle>Новая запись</DialogTitle>
              <DialogDescription>
                Выберите услугу, свободное время и заполните данные клиента.
              </DialogDescription>
              <BookingWizard services={services} adminMode />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
function OrderList({
  bookings,
  onSelect,
}: {
  bookings: Booking[];
  onSelect: (b: Booking) => void;
}) {
  const [filter, setFilter] = useState("all");
  return (
    <>
      <div className="order-filters">
        <select
          aria-label="Фильтр статуса"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Все статусы</option>
          {Object.entries(statuses).map(([k, v]) => (
            <option value={k} key={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="orders-list">
        {bookings
          .filter((b) => filter === "all" || b.status === filter)
          .map((b) => (
            <button
              className="order-row"
              key={b.id}
              onClick={() => onSelect(b)}
            >
              <div>
                <b>{b.customer.name}</b>
                <small>{b.number}</small>
              </div>
              <div>
                <b>{b.items[0]?.service.title ?? "Обратный звонок"}</b>
                <small>
                  {b.startsAt
                    ? formatInTimeZone(
                        new Date(b.startsAt),
                        "Europe/Moscow",
                        "dd.MM.yyyy · HH:mm",
                      )
                    : "Время не выбрано"}
                </small>
              </div>
              <span className={"status-badge status-" + b.status}>
                {statuses[b.status]}
              </span>
              <strong>{money(b.total)}</strong>
              <ArrowUpRight size={16} />
            </button>
          ))}
        {!bookings.length && <p className="admin-empty">Заявок пока нет.</p>}
      </div>
    </>
  );
}
function OrderEditor({
  booking: b,
  teams,
  services,
  onSave,
}: {
  booking: Booking;
  teams: Team[];
  services: ServiceDTO[];
  onSave: (v: unknown) => Promise<void>;
}) {
  const [status, setStatus] = useState(b.status),
    [comment, setComment] = useState(b.internalComment),
    [date, setDate] = useState(b.startsAt ? localTime(b.startsAt) : ""),
    [team, setTeam] = useState(
      b.allocations.find((a) => a.active)?.teamId ?? "",
    ),
    [busy, setBusy] = useState(false),
    [total, setTotal] = useState(b.total),
    [selection, setSelection] = useState(b.items[0]?.parameters ?? null);
  const service = services.find((s) => s.id === selection?.serviceId);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const data: Row = { status, internalComment: comment };
    if (total !== b.total) data.total = total;
    if (date && date !== (b.startsAt ? localTime(b.startsAt) : ""))
      data.startsAt = fromZonedTime(date, "Europe/Moscow").toISOString();
    if (team && team !== b.allocations.find((a) => a.active)?.teamId)
      data.teamId = team;
    if (
      JSON.stringify(selection) !==
      JSON.stringify(b.items[0]?.parameters ?? null)
    )
      data.selection = selection;
    await onSave({ action: "booking", id: b.id, data });
    setBusy(false);
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="customer-card">
        <h3>{b.customer.name}</h3>
        <a href={"tel:+" + b.customer.phone}>+{b.customer.phone}</a>
        <p>{b.address}</p>
        {b.comment && <p>Комментарий: {b.comment}</p>}
        <strong>
          {money(b.total)} <small>предварительно</small>
        </strong>
      </div>
      <label>
        Согласованная стоимость, ₽
        <input
          type="number"
          min={0}
          max={10000000}
          value={total}
          onChange={(e) => setTotal(Number(e.target.value))}
        />
      </label>
      <label>
        Статус
        <select
          aria-label="Статус"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {Object.entries(statuses).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      {b.startsAt && (
        <>
          <div className="form-row">
            <label>
              Дата и время (МСК)
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Бригада
              <select value={team} onChange={(e) => setTeam(e.target.value)}>
                <option value="">Автоматически</option>
                {teams
                  .filter((t) => t.active || t.id === team)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {selection && (
            <>
              <label>
                Услуга
                <select
                  value={selection.serviceId}
                  onChange={(e) => {
                    const s = services.find((x) => x.id === e.target.value);
                    if (s)
                      setSelection({
                        serviceId: s.id,
                        priceId: s.prices[0].id,
                        quantity: 1,
                        extras: [],
                      });
                  }}
                >
                  {services.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label>
                  Вариант
                  <select
                    value={selection.priceId}
                    onChange={(e) =>
                      setSelection({ ...selection, priceId: e.target.value })
                    }
                  >
                    {service?.prices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} · {materialNames[p.material] ?? p.material}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Количество
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={selection.quantity}
                    onChange={(e) =>
                      setSelection({
                        ...selection,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
              {allowedExtras(service?.slug ?? "").map((key) => (
                <label className="check-label" key={key}>
                  <input
                    type="checkbox"
                    checked={selection.extras.includes(key)}
                    onChange={(e) =>
                      setSelection({
                        ...selection,
                        extras: e.target.checked
                          ? [...selection.extras, key]
                          : selection.extras.filter((x) => x !== key),
                      })
                    }
                  />
                  {extraTitles[key]}
                </label>
              ))}
            </>
          )}
        </>
      )}
      <label>
        Внутренний комментарий
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <Button disabled={busy}>
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <Check size={17} />
        )}
        Сохранить
      </Button>
      <div className="order-history">
        <h3>История</h3>
        {b.history.map((h, i) => (
          <p key={i}>
            {formatInTimeZone(
              new Date(h.createdAt),
              "Europe/Moscow",
              "dd.MM HH:mm",
            )}{" "}
            · {statuses[h.status]}
          </p>
        ))}
      </div>
    </form>
  );
}
function AdminCalendar({
  bookings: initialBookings,
  onSelect,
}: {
  bookings: Booking[];
  onSelect: (b: Booking) => void;
}) {
  const [view, setView] = useState("month"),
    [date, setDate] = useState(
      formatInTimeZone(new Date(), "Europe/Moscow", "yyyy-MM-dd"),
    );
  const start =
    view === "month"
      ? startOfMonth(new Date(date + "T12:00:00"))
      : view === "week"
        ? startOfWeek(new Date(date + "T12:00:00"), { weekStartsOn: 1 })
        : new Date(date + "T12:00:00");
  const count =
    view === "month" ? getDaysInMonth(start) : view === "week" ? 7 : 1;
  const offset = view === "month" ? (start.getDay() + 6) % 7 : 0;
  const [bookings, setBookings] = useState(initialBookings),
    [calendarError, setCalendarError] = useState("");
  const from = format(start, "yyyy-MM-dd"),
    to = format(addDays(start, count), "yyyy-MM-dd");
  useEffect(() => {
    const a = new AbortController();
    setCalendarError("");
    fetch(
      "/api/admin?view=calendar&from=" +
        encodeURIComponent(
          fromZonedTime(from + "T00:00:00", "Europe/Moscow").toISOString(),
        ) +
        "&to=" +
        encodeURIComponent(
          fromZonedTime(to + "T00:00:00", "Europe/Moscow").toISOString(),
        ),
      { signal: a.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setBookings(d.bookings);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setCalendarError(e.message);
      });
    return () => a.abort();
  }, [from, to, initialBookings]);
  return (
    <section className="admin-panel">
      <div className="admin-calendar-toolbar">
        <div className="filter-tabs">
          {[
            ["day", "День"],
            ["week", "Неделя"],
            ["month", "Месяц"],
          ].map(([v, t]) => (
            <button
              key={v}
              className={view === v ? "selected" : ""}
              onClick={() => setView(v)}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label="Дата календаря"
        />
      </div>
      <h2>{format(start, "LLLL yyyy", { locale: ru })}</h2>
      <div className={"admin-calendar-grid view-" + view}>
        {Array.from({ length: offset }, (_, i) => (
          <div className="calendar-blank" key={"blank" + i} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const day = format(addDays(start, i), "yyyy-MM-dd");
          return (
            <div className="admin-calendar-day" key={day}>
              <b>{format(addDays(start, i), "d EEE", { locale: ru })}</b>
              {bookings
                .filter(
                  (b) =>
                    b.startsAt &&
                    formatInTimeZone(
                      new Date(b.startsAt),
                      "Europe/Moscow",
                      "yyyy-MM-dd",
                    ) === day &&
                    b.status !== "CANCELLED" &&
                    b.status !== "EXPIRED",
                )
                .map((b) => (
                  <button key={b.id} onClick={() => onSelect(b)}>
                    <strong>
                      {formatInTimeZone(
                        new Date(b.startsAt!),
                        "Europe/Moscow",
                        "HH:mm",
                      )}
                    </strong>
                    <span>{b.customer.name}</span>
                    <small>{b.items[0]?.service.title}</small>
                  </button>
                ))}
            </div>
          );
        })}
      </div>
      {calendarError && (
        <p role="alert" className="error-box">
          {calendarError}
        </p>
      )}
      <p className="small muted">
        Все записи за выбранный интервал · московское время.
      </p>
    </section>
  );
}
function ScheduleEditor({
  teams,
  mutate,
}: {
  teams: Team[];
  mutate: (v: unknown) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState(teams[0]?.id ?? "");
  const team = teams.find((t) => t.id === selected);
  return (
    <div>
      <div className="schedule-toolbar">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Бригада"
        >
          {teams.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={async () => {
            await mutate({
              action: "team",
              data: { name: "Новая бригада", active: false, travelMinutes: 30 },
            });
          }}
        >
          <Plus size={16} />
          Добавить бригаду
        </Button>
      </div>
      {team && (
        <>
          <section className="admin-panel">
            <TeamEditor team={team} mutate={mutate} />
          </section>
          <section className="admin-panel">
            <h2>Недельный график</h2>
            <p className="muted small">
              Нет строки на день — бригада не работает. Одинаковое начало и
              окончание не допускаются. Блокировки не могут пересекать
              существующие записи.
            </p>
            <div className="schedule-table">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <ScheduleRow
                  key={team.id + "-" + day}
                  teamId={team.id}
                  weekday={day}
                  row={team.schedules.find((s) => s.weekday === day)}
                  mutate={mutate}
                />
              ))}
            </div>
          </section>
          <section className="admin-panel">
            <h2>Заблокировать интервал</h2>
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                const ok = await mutate({
                  action: "exception",
                  data: {
                    teamId: team.id,
                    startsAt: fromZonedTime(
                      String(f.get("from")),
                      "Europe/Moscow",
                    ).toISOString(),
                    endsAt: fromZonedTime(
                      String(f.get("to")),
                      "Europe/Moscow",
                    ).toISOString(),
                    reason: String(f.get("reason")),
                  },
                });
                if (ok) form.reset();
              }}
            >
              <div className="form-row">
                <label>
                  С (МСК)
                  <input type="datetime-local" name="from" required />
                </label>
                <label>
                  До (МСК)
                  <input type="datetime-local" name="to" required />
                </label>
              </div>
              <label>
                Причина
                <input name="reason" required minLength={2} maxLength={200} />
              </label>
              <Button>Заблокировать</Button>
            </form>
            <div className="exceptions-list">
              {team.exceptions.map((x) => (
                <div key={x.id}>
                  <p>
                    {x.reason}
                    <small>
                      {localTime(x.startsAt).replace("T", " ")} —{" "}
                      {localTime(x.endsAt).replace("T", " ")}
                    </small>
                  </p>
                  <button
                    aria-label="Снять блокировку"
                    onClick={() =>
                      mutate({ action: "deleteException", id: x.id })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
function TeamEditor({
  team,
  mutate,
}: {
  team: Team;
  mutate: (v: unknown) => Promise<boolean>;
}) {
  return (
    <form
      key={team.id + team.active}
      className="team-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        mutate({
          action: "team",
          data: {
            id: team.id,
            name: String(f.get("name")),
            travelMinutes: Number(f.get("travel")),
            active: f.get("active") === "on",
          },
        });
      }}
    >
      <label>
        Название
        <input name="name" defaultValue={team.name} required />
      </label>
      <label>
        Время на дорогу, минут
        <input
          name="travel"
          type="number"
          min={0}
          max={180}
          defaultValue={team.travelMinutes}
        />
      </label>
      <label className="check-label">
        <input name="active" type="checkbox" defaultChecked={team.active} />
        Принимать записи
      </label>
      <Button size="sm">Сохранить</Button>
    </form>
  );
}
function ScheduleRow({
  teamId,
  weekday,
  row,
  mutate,
}: {
  teamId: string;
  weekday: number;
  row?: Schedule;
  mutate: (v: unknown) => Promise<boolean>;
}) {
  const day = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][weekday];
  return (
    <form
      className="schedule-row"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        mutate({
          action: "schedule",
          data: {
            teamId,
            weekday,
            startMinute: toMinute(String(f.get("start"))),
            endMinute: toMinute(String(f.get("end"))),
            breakStart: toMinute(String(f.get("bs"))),
            breakEnd: toMinute(String(f.get("be"))),
          },
        });
      }}
    >
      <b>
        {day}
        {!row && <small className="muted">выходной</small>}
      </b>
      <label>
        Начало
        <input
          type="time"
          name="start"
          defaultValue={minuteTime(row?.startMinute ?? 540)}
          required
        />
      </label>
      <label>
        Конец
        <input
          type="time"
          name="end"
          defaultValue={minuteTime(row?.endMinute ?? 1140)}
          required
        />
      </label>
      <label>
        Перерыв с
        <input
          type="time"
          name="bs"
          defaultValue={minuteTime(row?.breakStart ?? null)}
        />
      </label>
      <label>
        Перерыв до
        <input
          type="time"
          name="be"
          defaultValue={minuteTime(row?.breakEnd ?? null)}
        />
      </label>
      <Button variant="outline" size="sm" aria-label={"Сохранить " + day}>
        <Check size={17} />
      </Button>
      {row && (
        <button
          type="button"
          className="schedule-dayoff"
          onClick={() =>
            mutate({ action: "deleteSchedule", data: { teamId, weekday } })
          }
        >
          Выходной
        </button>
      )}
    </form>
  );
}
function ContentEditor({
  data,
  mutate,
}: {
  data: AdminData;
  mutate: (v: unknown) => Promise<boolean>;
}) {
  const [model, setModel] = useState("Service"),
    [id, setId] = useState(""),
    [draft, setDraft] = useState<Row>({ ...templates.Service }),
    [busy, setBusy] = useState(false),
    [uploadError, setUploadError] = useState("");
  function select(modelName: string, row?: Row) {
    setModel(modelName);
    setId(String(row?.id ?? ""));
    const next: Row = {};
    for (const key of Object.keys(templates[modelName]))
      next[key] = row?.[key] ?? templates[modelName][key];
    setDraft(next);
  }
  async function upload(file: File, key: string) {
    setUploadError("");
    setBusy(true);
    try {
      const f = new FormData();
      f.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: f });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setDraft((v) => ({ ...v, [key]: d.url }));
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="filter-tabs content-tabs">
        {Object.entries(modelNames).map(([k, v]) => (
          <button
            className={model === k ? "selected" : ""}
            key={k}
            onClick={() => select(k)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="content-editor-layout">
        <section className="admin-panel content-rows">
          <Button size="sm" onClick={() => select(model)}>
            <Plus size={15} />
            Добавить
          </Button>
          {data.content[model]?.map((row) => (
            <button
              className={id === row.id ? "selected" : ""}
              key={String(row.id)}
              onClick={() => select(model, row)}
            >
              <b>
                {String(
                  row.title ??
                    row.question ??
                    row.author ??
                    row.label ??
                    row.name ??
                    row.id,
                )}
              </b>
              <small>
                {row.published === false || row.active === false
                  ? "Скрыто"
                  : row.amount !== undefined
                    ? money(Number(row.amount))
                    : ""}
              </small>
            </button>
          ))}
        </section>
        <section className="admin-panel">
          <h2>
            {id ? "Редактирование" : "Новая запись"} · {modelNames[model]}
          </h2>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              await mutate({
                action: "content",
                model,
                id: id || undefined,
                data: draft,
              });
              setBusy(false);
            }}
          >
            {Object.entries(draft).map(([key, value]) => {
              const set = (v: unknown) => setDraft((d) => ({ ...d, [key]: v }));
              if (typeof value === "boolean")
                return (
                  <label className="check-label" key={key}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => set(e.target.checked)}
                    />
                    {labels[key] ?? key}
                  </label>
                );
              if (key === "categoryId" || key === "serviceId")
                return (
                  <label key={key}>
                    {labels[key]}
                    <select
                      value={String(value)}
                      onChange={(e) => set(e.target.value)}
                      required
                    >
                      <option value="">Выберите</option>
                      {data.content[
                        key === "categoryId" ? "ServiceCategory" : "Service"
                      ].map((r) => (
                        <option key={String(r.id)} value={String(r.id)}>
                          {String(r.name ?? r.title)}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              const multiline = ["answer", "description", "text"].includes(key);
              return (
                <label key={key}>
                  {labels[key] ?? key}
                  {multiline ? (
                    <textarea
                      rows={4}
                      value={String(value ?? "")}
                      onChange={(e) => set(e.target.value)}
                    />
                  ) : (
                    <input
                      type={typeof value === "number" ? "number" : "text"}
                      value={String(value ?? "")}
                      onChange={(e) =>
                        set(
                          typeof value === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                        )
                      }
                    />
                  )}
                  {["image", "beforeImage", "afterImage"].includes(key) && (
                    <span className="upload-field">
                      <Upload size={14} />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        onChange={(e) =>
                          e.target.files?.[0] && upload(e.target.files[0], key)
                        }
                      />
                      <small>JPG, PNG, WebP · до 5 МБ</small>
                    </span>
                  )}
                </label>
              );
            })}
            {uploadError && (
              <p role="alert" className="error-box">
                {uploadError}
              </p>
            )}
            <Button disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Check size={16} />
              )}
              Сохранить
            </Button>
            <p className="small muted">
              Скрытые записи сохраняются в базе. Для публикации фотографий
              подтвердите права, для отзывов — источник.
            </p>
          </form>
        </section>
      </div>
    </>
  );
}
function SettingsEditor({
  setting: s,
  mutate,
}: {
  setting: { key: string; value: Row };
  mutate: (v: unknown) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(s.value),
    [busy, setBusy] = useState(false),
    [raw, setRaw] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  return (
    <section className="admin-panel">
      <h2>
        {s.key === "company"
          ? "Контакты"
          : s.key === "pricing"
            ? "Правила цены"
            : s.key === "texts"
              ? "Основные тексты"
              : "Правила записи"}
      </h2>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const value = { ...draft };
            for (const [k, v] of Object.entries(raw)) value[k] = JSON.parse(v);
            await mutate({ action: "settings", key: s.key, value });
          } catch {
            setError("Проверьте JSON правил: некорректный формат");
          }
          setBusy(false);
        }}
      >
        {Object.entries(draft).map(([key, v]) => (
          <label key={key}>
            {labels[key] ?? key}
            {typeof v === "object" ? (
              <textarea
                rows={6}
                value={raw[key] ?? JSON.stringify(v, null, 2)}
                onChange={(e) => setRaw({ ...raw, [key]: e.target.value })}
              />
            ) : (
              <input
                type={typeof v === "number" ? "number" : "text"}
                value={String(v)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [key]:
                      typeof v === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                  })
                }
              />
            )}
          </label>
        ))}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <Button size="sm" disabled={busy}>
          Сохранить
        </Button>
      </form>
    </section>
  );
}
