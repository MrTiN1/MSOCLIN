"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Armchair, Sparkles, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { company } from "@/lib/data";
import { CallbackButton } from "./callback-form";
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="МОС ХИМЧИСТКА — главная">
      <span className="logo-mark">
        <Armchair size={32} strokeWidth={1.5} />
        <Sparkles size={15} />
      </span>
      <span>
        <b>
          МОС<span className="logo-dot">.</span>
        </b>
        <small>ХИМЧИСТКА</small>
      </span>
    </Link>
  );
}
const nav = [
  ["Услуги", "/services"],
  ["Цены", "/calculator"],
  ["Наши работы", "/portfolio"],
  ["О нас", "/about"],
  ["Отзывы", "/reviews"],
  ["Контакты", "/contacts"],
];
export function Header({ info }: { info: typeof company }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Основная навигация">
          {nav.map(([t, h]) => (
            <Link href={h} key={h} className={path === h ? "active" : ""}>
              {t}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={"tel:" + info.tel}>
            <Phone size={16} />
            {info.phone}
          </a>
          <CallbackButton className="header-callback" />
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" aria-label="Мобильная навигация">
          {nav.map(([t, h]) => (
            <Link href={h} key={h} onClick={() => setOpen(false)}>
              {t}
              <ArrowUpRight size={18} />
            </Link>
          ))}
          <Link
            href="/booking"
            onClick={() => setOpen(false)}
            className="btn btn-green"
          >
            Записаться онлайн
          </Link>
          <a href={"tel:" + info.tel}>{info.phone}</a>
        </nav>
      )}
    </header>
  );
}
