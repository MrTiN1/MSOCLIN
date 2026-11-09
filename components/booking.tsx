"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMonths, startOfMonth, getDaysInMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { ServiceDTO } from "@/lib/catalog";
import type { Selection } from "@/lib/validation";
import { money, materialNames, statuses } from "@/lib/data";
import { ServiceIcon } from "./shared";
import {
  useQuote,
  QuoteSummary,
  allowedExtras,
  extraTitles,
} from "./calculator";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { maskPhone } from "./callback-form";
import { track } from "./analytics";
type Slot = { time: string; startsAt: string; available: boolean };
function Calendar({
  selection,
  value,
  onChange,
}: {
  selection: Selection;
  value: string;
  onChange: (v: string) => void;
}) {
  const today = formatInTimeZone(new Date(), "Europe/Moscow", "yyyy-MM-dd");
  const [month, setMonth] = useState(() =>
      startOfMonth(new Date(today + "T12:00:00")),
    ),
    [day, setDay] = useState(""),
    [slots, setSlots] = useState<Slot[]>([]),
    [days, setDays] = useState<Record<string, boolean>>({}),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(true),
    [refresh, setRefresh] = useState(0),
    [horizonDate, setHorizonDate] = useState(""),
    [error, setError] = useState("");
  const key = JSON.stringify(selection),
    monthKey = format(month, "yyyy-MM");
  useEffect(() => {
    const abort = new AbortController();
    setBusy(true);
    setError("");
    setDays({});
    track("calendar_opened");
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: monthKey + "-01",
        selection: JSON.parse(key),
        month: true,
      }),
      signal: abort.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setDays(d.days);
        setHorizonDate(d.horizonDate);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setBusy(false);
      });
    return () => abort.abort();
  }, [key, monthKey, refresh]);
  useEffect(() => {
    const timer = setInterval(() => setRefresh((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!open || !day) return;
    const timer = setInterval(async () => {
      try {
        const r = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: day, selection: JSON.parse(key) }),
        });
        const d = await r.json();
        if (r.ok) setSlots(d.slots);
      } catch {}
    }, 15000);
    return () => clearInterval(timer);
  }, [open, day, key]);
  async function selectDay(d: string) {
    setDay(d);
    setOpen(true);
    setLoading(true);
    setSlots([]);
    setError("");
    track("date_selected");
    try {
      const r = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: d, selection }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      setSlots(result.slots);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  const offset = (new Date(monthKey + "-01T12:00:00").getDay() + 6) % 7;
  return (
    <div className="booking-calendar">
      <div className="calendar-head">
        <h3>{format(month, "LLLL yyyy", { locale: ru })}</h3>
        <div>
          <button
            type="button"
            aria-label="Предыдущий месяц"
            disabled={monthKey <= today.slice(0, 7)}
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            disabled={!!horizonDate && monthKey >= horizonDate.slice(0, 7)}
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <p className="calendar-hint">
        <Clock3 size={14} />
        Московское время · Europe/Moscow
      </p>
      <div className="calendar-grid">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((x) => (
          <span key={x} className="weekday">
            {x}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={"empty" + i} />
        ))}
        {Array.from({ length: getDaysInMonth(month) }, (_, i) => {
          const d = monthKey + "-" + String(i + 1).padStart(2, "0");
          const selected =
            value &&
            formatInTimeZone(new Date(value), "Europe/Moscow", "yyyy-MM-dd") ===
              d;
          return (
            <button
              type="button"
              key={d}
              disabled={d < today || busy || !days[d]}
              aria-label={format(new Date(d + "T12:00:00"), "d MMMM yyyy", {
                locale: ru,
              })}
              aria-pressed={!!selected}
              className={
                (selected ? "chosen " : "") + (d === today ? "today" : "")
              }
              onClick={() => selectDay(d)}
            >
              {i + 1}
              {days[d] && <i />}
            </button>
          );
        })}
      </div>
      {busy ? (
        <p className="calendar-state">
          <LoaderCircle className="spin" size={17} />
          Проверяем расписание бригад…
        </p>
      ) : error ? (
        <p className="error-box" role="alert">
          {error}
        </p>
      ) : !Object.values(days).some(Boolean) ? (
        <p className="calendar-state">
          Свободных дат в этом месяце нет. Выберите следующий месяц или
          свяжитесь с менеджером.
        </p>
      ) : (
        <p className="calendar-state">
          <i className="green-dot" />
          Зелёная точка — есть свободное время
        </p>
      )}
      {value && (
        <div className="chosen-datetime">
          <CalendarDays size={20} />
          <div>
            <b>
              {formatInTimeZone(new Date(value), "Europe/Moscow", "d MMMM", {
                locale: ru,
              })}
            </b>
            <span>
              {formatInTimeZone(new Date(value), "Europe/Moscow", "HH:mm")} ·
              московское время
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              selectDay(
                formatInTimeZone(
                  new Date(value),
                  "Europe/Moscow",
                  "yyyy-MM-dd",
                ),
              )
            }
          >
            Изменить
          </button>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Выберите время</DialogTitle>
          <DialogDescription>
            {day
              ? format(new Date(day + "T12:00:00"), "d MMMM yyyy", {
                  locale: ru,
                })
              : ""}{" "}
            · московское время
          </DialogDescription>
          {loading ? (
            <p className="calendar-state">
              <LoaderCircle className="spin" />
              Проверяем свободное время…
            </p>
          ) : (
            <div className="time-grid">
              {slots.map((s) => (
                <button
                  type="button"
                  disabled={!s.available}
                  key={s.startsAt}
                  aria-pressed={value === s.startsAt}
                  className={value === s.startsAt ? "chosen" : ""}
                  onClick={() => {
                    onChange(s.startsAt);
                    setOpen(false);
                    track("time_selected");
                  }}
                >
                  <b>{s.time}</b>
                  <small>{s.available ? "Свободно" : "Занято"}</small>
                </button>
              ))}
            </div>
          )}
          {!loading && !slots.length && (
            <p>На эту дату нет доступного времени. Выберите другой день.</p>
          )}
          {error && (
            <p role="alert" className="error-box">
              {error}
            </p>
          )}
          <p className="muted small">
            Время резервируется после отправки заявки и требует подтверждения
            менеджера.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
const contactSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(80),
  phone: z
    .string()
    .refine(
      (s) => /^[78]\d{10}$/.test(s.replace(/\D/g, "")),
      "Укажите телефон полностью",
    ),
  address: z.string().trim().min(8, "Укажите улицу, дом и квартиру").max(400),
  comment: z.string().max(1500),
  consent: z.boolean().refine(Boolean, "Подтвердите согласие"),
  website: z.string().max(0),
});
type Contact = z.infer<typeof contactSchema>;
export function BookingWizard({
  services,
  mode = "booking",
  initialPrice = "",
  initialQuantity = 1,
  initialExtras = [],
  adminMode = false,
}: {
  services: ServiceDTO[];
  mode?: "booking" | "calculator";
  initialPrice?: string;
  initialQuantity?: number;
  initialExtras?: string[];
  adminMode?: boolean;
}) {
  const initial =
    services.find((s) => s.prices.some((p) => p.id === initialPrice)) ??
    services[0];
  const [serviceId, setService] = useState(initial?.id ?? ""),
    [priceId, setPrice] = useState(
      initialPrice || initial?.prices[0]?.id || "",
    ),
    [quantity, setQuantity] = useState(
      initial.prices.find((p) => p.id === initialPrice)?.unit === "quote"
        ? 1
        : initialQuantity,
    ),
    [extras, setExtras] = useState<string[]>(initialExtras),
    [step, setStep] = useState(0),
    [date, setDate] = useState(""),
    [error, setError] = useState(""),
    [result, setResult] = useState<{
      id: string;
      number: string;
      status: string;
    } | null>(null),
    [checking, setChecking] = useState(false);
  const service = services.find((s) => s.id === serviceId);
  const selection = useMemo(
    () => ({ serviceId, priceId, quantity, extras }) as Selection,
    [serviceId, priceId, quantity, extras],
  );
  const {
    quote,
    error: quoteError,
    loading,
  } = useQuote(service ? selection : null);
  const token = useRef(""),
    idempotency = useRef("");
  const f = useForm<Contact>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      comment: "",
      consent: false,
      website: "",
    },
  });
  const steps =
    mode === "booking"
      ? ["Услуга", "Параметры", "Дата и время", "Ваши данные"]
      : ["Услуга", "Параметры", "Дополнительно", "Стоимость"];
  function chooseService(s: ServiceDTO) {
    setService(s.id);
    setQuantity(1);
    setPrice(s.prices[0]?.id ?? "");
    setExtras([]);
    setDate("");
    track("service_selected");
  }
  function next() {
    setStep((s) => s + 1);
    setError("");
    document
      .getElementById("wizard-top")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function submit(v: Contact) {
    setError("");
    if (!date) {
      setStep(2);
      return;
    }
    try {
      if (!token.current) {
        token.current = Array.from(
          crypto.getRandomValues(new Uint8Array(32)),
          (x) => x.toString(16).padStart(2, "0"),
        ).join("");
        idempotency.current = crypto.randomUUID();
      }
      track("booking_submitted");
      const body = {
        ...v,
        selection,
        startsAt: date,
        idempotencyKey: idempotency.current,
        accessToken: token.current,
      };
      const r = await fetch(adminMode ? "/api/admin" : "/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          adminMode ? { action: "createBooking", data: body } : body,
        ),
      });
      const d = await r.json();
      if (!r.ok) {
        if (r.status === 409) {
          setDate("");
          setStep(2);
        }
        throw Error(d.error);
      }
      setResult(d);
      track("booking_success");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function refreshStatus() {
    if (!result) return;
    setChecking(true);
    try {
      const r = await fetch("/api/bookings/" + result.id, {
        headers: { authorization: "Bearer " + token.current },
      });
      const d = await r.json();
      if (r.ok) setResult({ ...result, status: d.status });
      else setError(d.error);
    } finally {
      setChecking(false);
    }
  }
  if (!service)
    return (
      <p className="error-box">
        Список услуг временно недоступен. Позвоните нам для записи.
      </p>
    );
  if (result)
    return (
      <div className="booking-success">
        <span className="success-ring">
          <Check size={38} />
        </span>
        <span className="eyebrow">ЗАЯВКА СОХРАНЕНА</span>
        <h2>До встречи с чистотой.</h2>
        <p>
          Номер заявки <b>{result.number}</b>
        </p>
        <span className="status-badge">{statuses[result.status]}</span>
        <div className="booking-success-detail">
          <CalendarDays />
          <p>
            {formatInTimeZone(
              new Date(date),
              "Europe/Moscow",
              "d MMMM yyyy, HH:mm",
              { locale: ru },
            )}
            <br />
            <small>Московское время · {quote?.serviceTitle}</small>
          </p>
        </div>
        <p>
          Менеджер свяжется с вами, уточнит стоимость и подтвердит выезд. До
          подтверждения действует временный резерв.
        </p>
        <Button variant="outline" disabled={checking} onClick={refreshStatus}>
          <RefreshCw size={17} className={checking ? "spin" : ""} />
          Обновить статус
        </Button>
        {error && <p role="alert">{error}</p>}
        <Link href="/" className="text-link">
          На главную
          <ArrowRight size={17} />
        </Link>
      </div>
    );
  const extrasUI = (
    <div className="extras-list">
      {quote?.availableExtras.length ? (
        quote.availableExtras.map((rule) => {
          const key = rule.key;
          return (
            <label
              className={
                "extra-option " + (extras.includes(key) ? "selected" : "")
              }
              key={key}
            >
              <input
                type="checkbox"
                checked={extras.includes(key)}
                onChange={(e) => {
                  setExtras(
                    e.target.checked
                      ? [...extras, key]
                      : extras.filter((x) => x !== key),
                  );
                  setDate("");
                }}
              />
              <span>{rule.label}</span>
              <small>
                +{rule.percent ? rule.amount + "%" : money(rule.amount)}
              </small>
            </label>
          );
        })
      ) : (
        <p className="muted">
          Дополнительные работы для этого материала согласуются с технологом.
        </p>
      )}
    </div>
  );
  return (
    <div className="wizard" id="wizard-top">
      <div className="wizard-progress">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            disabled={i > step}
            className={i === step ? "current" : i < step ? "done" : ""}
            onClick={() => setStep(i)}
          >
            <span>
              {i < step ? <Check size={15} /> : String(i + 1).padStart(2, "0")}
            </span>
            <b>{s}</b>
          </button>
        ))}
      </div>
      <div className="wizard-layout">
        <div className="wizard-main">
          <div className="wizard-step-heading">
            <span className="eyebrow">ШАГ {step + 1} ИЗ 4</span>
            <h2>
              {step === 0
                ? "Что будем чистить?"
                : step === 1
                  ? "Несколько деталей"
                  : step === 2
                    ? mode === "booking"
                      ? "Когда вам удобно?"
                      : "Добавим особый уход?"
                    : mode === "booking"
                      ? "Куда приедет мастер?"
                      : "Всё прозрачно."}
            </h2>
            <p>
              {step === 0
                ? "Выберите услугу для вашего дома."
                : step === 1
                  ? "Параметры помогут оценить стоимость и длительность."
                  : step === 2
                    ? mode === "booking"
                      ? "Выберите день и свободное время в расписании."
                      : "Выберите только то, что нужно вашей мебели."
                    : mode === "booking"
                      ? "Остался последний шаг — контактные данные."
                      : "Сохраним параметры и перейдём к выбору даты."}
            </p>
          </div>
          {step === 0 && (
            <div className="service-choice-grid">
              {services.map((s) => (
                <button
                  type="button"
                  className={s.id === serviceId ? "selected" : ""}
                  key={s.id}
                  onClick={() => chooseService(s)}
                >
                  <ServiceIcon slug={s.slug} size={28} />
                  <span>
                    <b>{s.title}</b>
                    <small>
                      от {money(Math.min(...s.prices.map((p) => p.amount)))}
                    </small>
                  </span>
                  {s.id === serviceId && <Check size={18} />}
                </button>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="form-stack">
              <label>
                Размер и материал
                <select
                  value={priceId}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setQuantity(1);
                    setDate("");
                  }}
                >
                  {service.prices.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.label} · {materialNames[p.material] ?? p.material}
                    </option>
                  ))}
                </select>
              </label>
              {service.prices.find((p) => p.id === priceId)?.unit !==
                "quote" && (
                <label>
                  {service.prices.find((p) => p.id === priceId)?.unit === "m2"
                    ? "Площадь, м²"
                    : "Количество предметов"}
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(
                        Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                      );
                      setDate("");
                    }}
                  />
                </label>
              )}
              {mode === "booking" && (
                <>
                  <h3>Дополнительный уход</h3>
                  {extrasUI}
                </>
              )}
              <p className="notice">
                Все опубликованные цены — предварительные. Для нестандартных
                изделий технолог уточнит оценку перед началом работ.
              </p>
            </div>
          )}
          {step === 2 &&
            (mode === "booking" ? (
              <Calendar selection={selection} value={date} onChange={setDate} />
            ) : (
              extrasUI
            ))}
          {step === 3 &&
            (mode === "calculator" ? (
              <div className="calculator-final">
                <QuoteSummary quote={quote} loading={loading} />
                <Link
                  className="btn btn-green"
                  href={`/booking?price=${priceId}&quantity=${quantity}&extras=${extras.join(",")}`}
                >
                  Выбрать дату и время
                  <ArrowRight size={18} />
                </Link>
                <p className="muted small">
                  Скидки согласуются менеджером отдельно.
                </p>
              </div>
            ) : (
              <form
                className="form-stack"
                onSubmit={f.handleSubmit(submit)}
                id="booking-form"
              >
                <div className="form-row">
                  <label>
                    Ваше имя
                    <input
                      aria-label="Ваше имя"
                      aria-invalid={!!f.formState.errors.name}
                      autoComplete="given-name"
                      placeholder="Имя"
                      {...f.register("name")}
                    />
                    <small className="field-error">
                      {f.formState.errors.name?.message}
                    </small>
                  </label>
                  <label>
                    Телефон
                    <input
                      aria-label="Телефон"
                      aria-invalid={!!f.formState.errors.phone}
                      type="tel"
                      autoComplete="tel"
                      placeholder="+7 (___) ___-__-__"
                      {...f.register("phone")}
                      onChange={(e) =>
                        f.setValue("phone", maskPhone(e.target.value))
                      }
                    />
                    <small className="field-error">
                      {f.formState.errors.phone?.message}
                    </small>
                  </label>
                </div>
                <label>
                  Адрес в Москве или области
                  <input
                    aria-label="Адрес в Москве или области"
                    aria-invalid={!!f.formState.errors.address}
                    autoComplete="street-address"
                    placeholder="Улица, дом, корпус, квартира"
                    {...f.register("address")}
                  />
                  <small className="field-error">
                    {f.formState.errors.address?.message}
                  </small>
                </label>
                <label>
                  Комментарий
                  <textarea
                    rows={3}
                    placeholder="Тип загрязнения, особенности проезда…"
                    {...f.register("comment")}
                  />
                </label>
                <input
                  className="honeypot"
                  tabIndex={-1}
                  autoComplete="off"
                  {...f.register("website")}
                />
                <label className="check-label">
                  <input type="checkbox" {...f.register("consent")} />
                  <span>
                    Согласен на{" "}
                    <Link href="/privacy" target="_blank">
                      обработку персональных данных
                    </Link>{" "}
                    для оформления заявки
                  </span>
                </label>
                <small className="field-error">
                  {f.formState.errors.consent?.message}
                </small>
                <div className="booking-final-time">
                  <CalendarDays size={19} />
                  {date &&
                    formatInTimeZone(
                      new Date(date),
                      "Europe/Moscow",
                      "d MMMM, HH:mm",
                      { locale: ru },
                    )}{" "}
                  · МСК
                </div>
                <Button
                  disabled={loading || !quote || f.formState.isSubmitting}
                  type="submit"
                >
                  {f.formState.isSubmitting ? (
                    <LoaderCircle size={18} className="spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  Подтвердить заявку
                  <ArrowRight size={18} />
                </Button>
                <p className="small muted">
                  Выезд состоится после подтверждения менеджером. Оплата после
                  завершения работ.
                </p>
              </form>
            ))}
          {(error || quoteError) && (
            <p className="error-box" role="alert">
              {error || quoteError}
            </p>
          )}
          <div className="wizard-controls">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={17} />
                Назад
              </Button>
            )}
            {step < 3 && (
              <Button
                onClick={next}
                disabled={
                  loading ||
                  !quote ||
                  !!quoteError ||
                  (step === 2 && mode === "booking" && !date)
                }
              >
                Продолжить
                <ArrowRight size={17} />
              </Button>
            )}
          </div>
        </div>
        <aside className="wizard-aside">
          <QuoteSummary quote={quote} loading={loading} />
          <div className="assurance">
            <ShieldCheck size={23} />
            <p>
              Бережная чистка.
              <br />
              Понятная стоимость.
              <br />
              Без предоплаты.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
