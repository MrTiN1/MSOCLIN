import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Leaf,
  ShieldCheck,
  Play,
  Star,
  ExternalLink,
  ChevronRight,
  CreditCard,
  QrCode,
  Building2,
  Check,
} from "lucide-react";
import { getServices, getTexts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { company } from "@/lib/data";
import {
  SectionHead,
  ServiceCard,
  Benefits,
  Process,
  PromotionBanner,
} from "@/components/shared";
import { MiniCalculator } from "@/components/calculator";
import { PortfolioGallery } from "@/components/portfolio";
import { FAQList } from "@/components/faq";
import { Reveal } from "@/components/reveal";
export const metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  const [services, faq, portfolio, promos, texts] = await Promise.all([
    getServices(),
    db.fAQ.findMany({
      where: { published: true },
      orderBy: { position: "asc" },
    }),
    db.portfolioItem.findMany({
      where: { published: true, rightsConfirmed: true },
    }),
    db.promotion.findMany({ where: { active: true, id: "first" }, take: 1 }),
    getTexts(),
  ]);
  const featured = ["sofa", "carpet", "mattress", "armchair"].flatMap((slug) =>
    services.filter((s) => s.slug === slug),
  );
  return (
    <div className="home-wrap">
      <div className="home-grid">
        <div className="home-left">
          <section className="hero">
            <div className="hero-photo">
              <Image
                src="/images/hero.jpg"
                alt="Мягкая мебель в уютной гостиной"
                fill
                priority
                sizes="(max-width:1000px) 100vw, 70vw"
              />
            </div>
            <div className="hero-shade" />
            <div className="hero-content">
              <span className="hero-badge">
                <span className="green-dot" />
                Профессиональная химчистка в Москве
              </span>
              <h1>
                {texts.heroLine1}
                <br />
                {texts.heroLine2}
                <br />
                <em>{texts.heroAccent}</em>
                <span className="title-dot">.</span>
              </h1>
              <p>{texts.heroDescription}</p>
              <div className="hero-buttons">
                <Link href="/booking" className="btn btn-green">
                  <CalendarDays size={19} />
                  Заказать чистку
                  <ArrowRight size={18} />
                </Link>
                <Link href="/about#process" className="btn btn-outline">
                  <Play size={17} />
                  Как мы работаем
                </Link>
              </div>
              <div className="hero-benefits">
                <span>
                  <Clock3 />
                  <b>
                    В удобное
                    <br />
                    для вас время
                  </b>
                </span>
                <span>
                  <Leaf />
                  <b>
                    Бережные
                    <br />
                    средства
                  </b>
                </span>
                <span>
                  <ShieldCheck />
                  <b>
                    Оплата после
                    <br />
                    результата
                  </b>
                </span>
              </div>
            </div>
            <Link href="/booking" className="hero-floating">
              <span className="floating-check">
                <Check size={21} />
              </span>
              <div>
                <small>СВЕЖЕСТЬ В КАЖДОЙ ДЕТАЛИ</small>
                <b>
                  Чистый дом.
                  <br />
                  Без лишних забот.
                </b>
              </div>
              <ArrowUpRight size={20} />
            </Link>
            <div className="hero-caption">
              <span />
              Москва и Московская область
            </div>
          </section>
          <Reveal className="home-section">
            <SectionHead
              title="Наши услуги"
              subtitle="Профессиональный уход за любимыми вещами"
              href="/services"
              label="Все услуги"
            />
            <div className="home-services">
              {featured.map((s) => (
                <ServiceCard service={s} compact key={s.id} />
              ))}
            </div>
          </Reveal>
          <Reveal className="home-section">
            <SectionHead title="Почему выбирают нас" />
            <Benefits />
          </Reveal>
          <Reveal className="home-section home-about">
            <span className="eyebrow">С 2014 ГОДА ЗАБОТИМСЯ О ВАШЕМ ДОМЕ</span>
            <h2>{texts.aboutTitle}</h2>
            <p>{texts.aboutDescription}</p>
            <Link href="/about" className="text-link">
              Ближе к нашей работе
              <ArrowUpRight size={17} />
            </Link>
          </Reveal>
        </div>
        <aside className="home-right">
          <section className="side-section">
            <SectionHead title="Как мы работаем" />
            <Process />
          </section>
          <Reveal className="side-section">
            <SectionHead
              title="Наши работы"
              href="/portfolio"
              label="Все работы"
            />
            <PortfolioGallery items={portfolio} compact />
          </Reveal>
          <Reveal className="side-section calc-side">
            <MiniCalculator services={services} />
          </Reveal>
          <Reveal className="side-section">
            <SectionHead
              title="Отзывы клиентов"
              href="/reviews"
              label="Все отзывы"
            />
            <div className="review-source-card">
              <span className="review-platform">
                Я<span>ндекс</span>
              </span>
              <div>
                <h3>Настоящий опыт наших клиентов</h3>
                <p>
                  Читайте отзывы и смотрите актуальные оценки на независимой
                  площадке.
                </p>
                <a
                  className="text-link"
                  href={company.reviewsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть Яндекс Карты
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </Reveal>
          <section className="side-section payments-section">
            <SectionHead title="Удобно оплатить" />
            <div className="payment-methods">
              <span>
                <CreditCard />
                Картой
              </span>
              <span>
                <QrCode />
                По QR-коду
              </span>
              <span>
                <Building2 />
                Безналично
              </span>
            </div>
            <p>Оплата после завершения работ. Без предоплаты.</p>
          </section>
          {promos[0] && (
            <Reveal className="side-section">
              <PromotionBanner
                title={promos[0].title}
                description={promos[0].description.split(".")[0].slice(0, 120)}
              />
            </Reveal>
          )}
        </aside>
      </div>
      <Reveal className="faq-section">
        <div>
          <span className="eyebrow">ВСЁ, ЧТО ВЫ ХОТЕЛИ УЗНАТЬ</span>
          <h2>
            Чистота начинается
            <br />с доверия.
          </h2>
          <p>
            Отвечаем на частые вопросы о чистке,
            <br />
            средствах и подготовке к приезду мастера.
          </p>
          <Link href="/contacts" className="text-link">
            Задать свой вопрос
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <FAQList items={faq} />
      </Reveal>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: company.name,
            telephone: company.phone,
            areaServed: ["Москва", "Московская область"],
            address: {
              "@type": "PostalAddress",
              streetAddress: "Большая Грузинская, 30А, стр. 1, офис 302",
              addressLocality: "Москва",
              addressCountry: "RU",
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
