"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, LoaderCircle, Check } from "lucide-react";
import type { ServiceDTO } from "@/lib/catalog";
import type { Selection } from "@/lib/validation";
import type { Quote } from "@/lib/pricing";
import { money, materialNames } from "@/lib/data";
import { track } from "./analytics";
export function useQuote(selection: Selection | null) {
  const [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const key = JSON.stringify(selection);
  useEffect(() => {
    if (!selection) return;
    const abort = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: key,
      signal: abort.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setQuote(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setQuote(null);
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [key]);
  return { quote, error, loading };
}
export function MiniCalculator({ services }: { services: ServiceDTO[] }) {
  const [id, setId] = useState(services[0]?.id ?? ""),
    [price, setPrice] = useState(services[0]?.prices[0]?.id ?? "");
  const service = services.find((s) => s.id === id);
  const selection = useMemo(
    () =>
      service
        ? { serviceId: id, priceId: price, quantity: 1, extras: [] }
        : null,
    [id, price, service],
  );
  const { quote, error, loading } = useQuote(selection);
  if (!service) return null;
  return (
    <section className="mini-calculator" id="quick-calculator">
      <div className="section-head">
        <div>
          <span className="eyebrow">БЕЗ СКРЫТЫХ ПЛАТЕЖЕЙ</span>
          <h2>Рассчитайте стоимость</h2>
          <p>Предварительная оценка за несколько секунд</p>
        </div>
        <Calculator size={28} strokeWidth={1.3} />
      </div>
      <div className="mini-calc-fields">
        <label>
          Что чистим?
          <select
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setPrice(
                services.find((s) => s.id === e.target.value)?.prices[0]?.id ??
                  "",
              );
              track("service_selected");
            }}
          >
            {services.map((s) => (
              <option value={s.id} key={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Размер и материал
          <select value={price} onChange={(e) => setPrice(e.target.value)}>
            {service.prices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} · {materialNames[p.material] ?? p.material}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      <div className="mini-calc-result">
        <div>
          <span>Предварительная стоимость</span>
          <strong>
            {loading ? (
              <LoaderCircle className="spin" />
            ) : quote ? (
              money(quote.total)
            ) : (
              "—"
            )}
          </strong>
          <small>С учётом минимального выезда</small>
        </div>
        <Link href={"/booking?price=" + price} className="btn btn-green">
          Выбрать дату
          <ArrowRight size={17} />
        </Link>
      </div>
      <Link href="/calculator" className="calculator-details">
        Добавить предметы и дополнительные услуги
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}
export const extraTitles: Record<string, string> = {
  heavy: "Сильное загрязнение",
  odor: "Устранение запаха",
  steam: "Обработка паром",
  antistatic: "Антистатик",
  dry: "Сушка",
  antibacterial: "Антибактериальная обработка",
};
export function allowedExtras(slug: string) {
  return ["sofa", "armchair"].includes(slug)
    ? ["heavy", "odor", "steam", "antistatic", "dry"]
    : slug === "mattress"
      ? Object.keys(extraTitles)
      : slug === "carpet"
        ? ["heavy", "odor", "antibacterial"]
        : [];
}
export function QuoteSummary({
  quote,
  loading = false,
}: {
  quote: Quote | null;
  loading?: boolean;
}) {
  return (
    <div className="quote-summary">
      <span className="eyebrow">ВАШ РАСЧЁТ</span>
      <h3>{quote?.serviceTitle ?? "Выберите услугу"}</h3>
      {quote && (
        <>
          <p>
            {quote.priceLabel} ·{" "}
            {materialNames[quote.material] ?? quote.material} · {quote.quantity}{" "}
            {quote.priceLabel.includes("м²") ? "м²" : "шт."}
          </p>
          <dl>
            <div>
              <dt>
                {quote.manual ? "Стартовая цена из прайса" : "Основная чистка"}
              </dt>
              <dd>{money(quote.base)}</dd>
            </div>
            {quote.extras.map((e) => (
              <div key={e.key}>
                <dt>{e.label}</dt>
                <dd>{money(e.amount)}</dd>
              </div>
            ))}
            {quote.subtotal < quote.minimum && (
              <div>
                <dt>Доплата до минимального выезда</dt>
                <dd>{money(quote.minimum - quote.subtotal)}</dd>
              </div>
            )}
          </dl>
          <div className="quote-total">
            <span>{quote.manual ? "Предварительно от" : "Предварительно"}</span>
            <strong>{loading ? "…" : money(quote.total)}</strong>
          </div>
          {quote.manual && (
            <p className="notice">
              Объём и итоговую стоимость уточнит менеджер по фото. В расчёте
              указан минимальный выезд.
            </p>
          )}
          <p className="quote-note">
            <Check size={15} />
            Без предоплаты. Итоговую стоимость согласуем до начала работ.
          </p>
        </>
      )}
    </div>
  );
}
