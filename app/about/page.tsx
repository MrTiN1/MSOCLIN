import Link from "next/link";
import Image from "next/image";
import {
  PageIntro,
  Benefits,
  Process,
  SectionHead,
  PromotionBanner,
} from "@/components/shared";
import { ArrowUpRight } from "lucide-react";
export const metadata = {
  title: "О компании",
  alternates: { canonical: "/about" },
};
export default function Page() {
  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="О компании"
        title="Забота, которую чувствуешь."
        description="С 2014 года «МосХимчистка» специализируется на выездной чистке мебели, ковров и деликатного текстиля в Москве."
      />
      <section className="about-story">
        <div className="about-photo">
          <Image
            src="/images/hero.jpg"
            fill
            sizes="50vw"
            alt="Светлая уютная гостиная"
          />
        </div>
        <div>
          <span className="eyebrow">БОЛЬШЕ, ЧЕМ ПРОСТО ЧИСТКА</span>
          <h2>
            Помогаем дому
            <br />
            оставаться <em>любимым.</em>
          </h2>
          <p>
            Мы — профильная компания по химической чистке текстиля, портьер и
            деликатных мебельных обивок. Начали с ухода за мебелью и коврами,
            затем добавили чистку штор на весу и изделий из нубука и натуральной
            кожи.
          </p>
          <p>
            Подбираем технологию под материал. Согласуем стоимость до начала
            работ. Принимаем оплату после завершения.
          </p>
          <a
            className="text-link"
            href="https://mos-drycleaning.ru/about/"
            target="_blank"
            rel="noreferrer"
          >
            Информация из официального источника
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>
      <section className="page-section">
        <Benefits />
      </section>
      <section id="process" className="page-section">
        <SectionHead
          title="Как мы работаем"
          subtitle="Четыре понятных шага от заявки до результата"
        />
        <Process large />
      </section>
      <section className="page-section">
        <SectionHead title="Оборудование для бережного результата" />
        <div className="equipment-grid">
          {[
            [
              "01",
              "Santoemma Sabrina",
              "Экстрактор для глубокой чистки мягкой мебели и ковров.",
            ],
            [
              "02",
              "Ghibli Power Extra 7P UFA",
              "Моющий экстрактор для мебели, штор и небольших площадей.",
            ],
            [
              "03",
              "Rotowash R4B",
              "Профессиональная машина для ухода за напольными покрытиями.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <PromotionBanner />
    </div>
  );
}
