import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarDays,
  Leaf,
  ShieldCheck,
  Clock3,
  Gem,
  Zap,
  Phone,
  MapPin,
  Mail,
  Send,
  ArrowRight,
  Armchair,
  Layers,
  BedDouble,
  CheckCheck,
  Truck,
  Check,
} from "lucide-react";
import { company, money } from "@/lib/data";
import type { ServiceDTO } from "@/lib/catalog";
import { Logo } from "./header";
import { CallbackButton } from "./callback-form";
export function SectionHead({
  title,
  subtitle,
  href,
  label = "Подробнее",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link">
          {label}
          <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function ServiceIcon({
  slug,
  size = 24,
}: {
  slug: string;
  size?: number;
}) {
  const Icon =
    slug === "sofa" || slug === "armchair"
      ? Armchair
      : slug === "mattress"
        ? BedDouble
        : slug === "carpet"
          ? Layers
          : Leaf;
  return <Icon size={size} strokeWidth={1.6} />;
}
export function ServiceCard({
  service,
  compact = false,
}: {
  service: ServiceDTO;
  compact?: boolean;
}) {
  return (
    <Link
      href={"/services/" + service.slug}
      className={"service-card " + (compact ? "compact" : "")}
    >
      <Image
        src={service.image}
        alt={service.title}
        fill
        sizes="(max-width: 600px) 50vw, 25vw"
      />
      <div className="service-card-shade" />
      <span className="service-price">
        от {money(Math.min(...service.prices.map((x) => x.amount)))}
      </span>
      <div className="service-card-bottom">
        <span className="circle-icon">
          <ServiceIcon slug={service.slug} />
        </span>
        <h3>{service.title}</h3>
        <ArrowUpRight className="service-arrow" size={20} />
      </div>
    </Link>
  );
}
export function Benefits() {
  return (
    <div className="benefits-grid">
      {[
        [
          Gem,
          "Профессиональное оборудование",
          "Экстракторы Santoemma и Ghibli для глубокой чистки.",
        ],
        [
          Leaf,
          "Бережные средства",
          "Подбираем состав под материал и тип загрязнения.",
        ],
        [
          Zap,
          "Удобный выезд",
          "Работаем в Москве и Московской области без выходных.",
        ],
        [
          ShieldCheck,
          "Прозрачные условия",
          "Согласуем стоимость до начала работ. Оплата по результату.",
        ],
      ].map(([I, title, text]) => {
        const Icon = I as typeof Gem;
        return (
          <article className="benefit-card" key={String(title)}>
            <Icon size={29} strokeWidth={1.6} />
            <h3>{String(title)}</h3>
            <p>{String(text)}</p>
          </article>
        );
      })}
    </div>
  );
}
export function Process({ large = false }: { large?: boolean }) {
  return (
    <div className={"process " + (large ? "large" : "")}>
      {[
        [CalendarDays, "Заявка", "Выбираете услугу и время"],
        [Truck, "Выезд", "Приезжаем по вашему адресу"],
        [Armchair, "Чистка", "Глубоко и бережно очищаем"],
        [CheckCheck, "Результат", "Принимаете работу и оплачиваете"],
      ].map(([I, t, d], i) => {
        const Icon = I as typeof CalendarDays;
        return (
          <div className="process-step" key={String(t)}>
            <div className="process-line">
              <span className="circle-icon">
                <Icon size={23} strokeWidth={1.5} />
              </span>
              <small>0{i + 1}</small>
            </div>
            <h3>{String(t)}</h3>
            <p>{String(d)}</p>
          </div>
        );
      })}
    </div>
  );
}
export function PromotionBanner({
  title = "Скидка 5%",
  description = "на первую чистку",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="promo-banner">
      <Image src="/images/sofa.jpg" fill alt="Уютный диван" sizes="60vw" />
      <div className="promo-content">
        <span className="eyebrow">ЗНАКОМСТВО С ЧИСТОТОЙ</span>
        <h2>
          <em>{title}</em>
          <br />
          {description}
        </h2>
        <p>Условия уточняйте у менеджера.</p>
      </div>
      <CallbackButton>
        Узнать условия
        <ArrowUpRight size={17} />
      </CallbackButton>
    </section>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="page-intro">
      <Link className="breadcrumbs" href="/">
        Главная <ArrowRight size={13} /> {eyebrow}
      </Link>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
export function Footer({ info }: { info: typeof company }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Logo />
          <p>
            Чистота, которую чувствуешь.
            <br />
            Москва и Московская область.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/services">Услуги</Link>
          <Link href="/calculator">Рассчитать стоимость</Link>
          <Link href="/booking">Онлайн-запись</Link>
          <Link href="/about">О компании</Link>
        </div>
        <div className="footer-contacts">
          <a href={"tel:" + info.tel}>
            <Phone size={16} />
            {info.phone}
          </a>
          <a href={"mailto:" + info.email}>
            <Mail size={16} />
            {info.email}
          </a>
          <span>
            <MapPin size={16} />
            {info.address}
          </span>
          <span>
            <Clock3 size={16} />
            {info.hours}
          </span>
        </div>
        <div className="socials">
          <a
            href={info.telegram}
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
          >
            <Send size={19} />
          </a>
          <a
            href={info.vk}
            target="_blank"
            rel="noreferrer"
            aria-label="ВКонтакте"
          >
            vk
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} МОС ХИМЧИСТКА</span>
        <Link href="/privacy">Политика конфиденциальности</Link>
        <Link href="/admin">Для сотрудников</Link>
      </div>
    </footer>
  );
}
