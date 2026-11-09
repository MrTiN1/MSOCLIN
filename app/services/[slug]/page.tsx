import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getMinimum } from "@/lib/catalog";
import { db } from "@/lib/db";
import { money, materialNames } from "@/lib/data";
import { PageIntro, Process, Benefits, SectionHead } from "@/components/shared";
import { FAQList } from "@/components/faq";
import { ArrowRight, CalendarDays, ExternalLink } from "lucide-react";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = await db.service.findUnique({ where: { slug } });
  return {
    title: s?.title ?? "Услуга",
    description: s?.description,
    alternates: { canonical: "/services/" + slug },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const minimum = await getMinimum();
  const s = await db.service.findUnique({
    where: { slug },
    include: { prices: { orderBy: { amount: "asc" } } },
  });
  if (!s?.active) notFound();
  const faq = await db.fAQ.findMany({
    where: { published: true },
    orderBy: { position: "asc" },
    take: 4,
  });
  return (
    <div className="page-shell">
      <PageIntro eyebrow="Услуги" title={s.title} description={s.description} />
      <div className="service-detail-hero">
        <Image src={s.image} alt={s.title} fill priority sizes="100vw" />
        <div>
          <span className="eyebrow">ВЫЕЗД В МОСКВЕ И ОБЛАСТИ</span>
          <h2>
            Вернём любимым вещам
            <br />
            свежесть и уют.
          </h2>
          <Link
            className="btn btn-green"
            href={"/booking?price=" + s.prices[0]?.id}
          >
            <CalendarDays size={18} />
            Выбрать время
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
      <div className="detail-columns">
        <section>
          <SectionHead title="Стоимость чистки" />
          <div className="price-table">
            {s.prices.map((p) => (
              <div key={p.id}>
                <span>
                  {p.label}
                  <small>{materialNames[p.material] ?? p.material}</small>
                </span>
                <b>от {money(p.amount)}</b>
                <Link
                  href={"/booking?price=" + p.id}
                  aria-label={"Заказать " + p.label}
                >
                  <ArrowRight size={19} />
                </Link>
              </div>
            ))}
          </div>
          <p className="notice">
            Предварительная оценка. Минимальный выезд — {money(minimum)}. Точную
            стоимость согласует технолог до начала работ.
          </p>
          <a
            className="text-link"
            href={s.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Прайс на официальном сайте
            <ExternalLink size={14} />
          </a>
        </section>
        <section>
          <SectionHead title="Как подготовиться" />
          <div className="preparation">
            <p>
              <b>01</b>Освободите доступ к мебели и уберите личные вещи.
            </p>
            <p>
              <b>02</b>Сообщите мастеру о пятнах, материале и предыдущей
              обработке.
            </p>
            <p>
              <b>03</b>Подготовьте доступ к воде и электричеству.
            </p>
            <p>
              <b>04</b>После чистки проветрите комнату. Высыхание обычно
              занимает 4–6 часов.
            </p>
          </div>
        </section>
      </div>
      <section className="page-section">
        <SectionHead title="От заявки до свежести" />
        <Process large />
      </section>
      <section className="page-section">
        <Benefits />
      </section>
      <section className="page-section">
        <SectionHead title="Частые вопросы" />
        <FAQList items={faq} />
      </section>
    </div>
  );
}
