"use client";
import { useState } from "react";
import { Search, ArrowUpRight, Star, ExternalLink } from "lucide-react";
import type { ServiceDTO } from "@/lib/catalog";
import { ServiceCard } from "./shared";
import { company } from "@/lib/data";
export function Catalog({ services }: { services: ServiceDTO[] }) {
  const [category, setCategory] = useState("Все"),
    [search, setSearch] = useState("");
  const categories = ["Все", ...new Set(services.map((s) => s.category.name))];
  const list = services.filter(
    (s) =>
      (category === "Все" || s.category.name === category) &&
      s.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="catalog-toolbar">
        <div className="filter-tabs">
          {categories.map((c) => (
            <button
              onClick={() => setCategory(c)}
              key={c}
              className={category === c ? "selected" : ""}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Найти услугу"
            placeholder="Найти услугу"
          />
        </label>
      </div>
      <div className="catalog-grid">
        {list.map((s) => (
          <article key={s.id}>
            <ServiceCard service={s} />
            <p>{s.description}</p>
            <a
              className="text-link"
              href={s.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Источник прайса
              <ExternalLink size={13} />
            </a>
          </article>
        ))}
      </div>
      {!list.length && (
        <div className="empty-state">
          <Search />
          <h3>Услуги не найдены</h3>
          <p>Попробуйте изменить запрос или категорию.</p>
          <button
            className="text-link"
            onClick={() => {
              setCategory("Все");
              setSearch("");
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </>
  );
}
type Review = {
  id: string;
  author: string;
  text: string;
  rating: number;
  sourceUrl: string;
  source: string;
};
export function Reviews({ items }: { items: Review[] }) {
  const [filter, setFilter] = useState("Все");
  const sources = ["Все", ...new Set(items.map((x) => x.source))];
  return (
    <>
      <div className="filter-tabs">
        {sources.map((s) => (
          <button
            key={s}
            className={filter === s ? "selected" : ""}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="reviews-grid">
        {items
          .filter((x) => filter === "Все" || x.source === filter)
          .map((r) => (
            <article className="review-card" key={r.id}>
              <div className="review-author">
                <span>{r.author[0]}</span>
                <div>
                  <b>{r.author}</b>
                  <div className="stars" aria-label={r.rating + " из 5"}>
                    {Array.from({ length: r.rating }, (_, i) => (
                      <Star size={13} fill="currentColor" key={i} />
                    ))}
                  </div>
                </div>
              </div>
              <p>{r.text}</p>
              <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                {r.source}
                <ExternalLink size={13} />
              </a>
            </article>
          ))}
      </div>
      {!items.length && (
        <div className="review-external">
          <span className="review-platform">
            Я<span>ндекс</span>
          </span>
          <h2>Пусть о нас расскажут клиенты.</h2>
          <p>
            Проверенные отзывы и актуальный рейтинг доступны в официальной
            карточке компании.
          </p>
          <a
            className="btn btn-green"
            href={company.reviewsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Читать отзывы
            <ArrowUpRight size={18} />
          </a>
          <a
            className="text-link"
            href={company.source + "/reviews/"}
            target="_blank"
            rel="noreferrer"
          >
            Отзывы на сайте компании
            <ExternalLink size={15} />
          </a>
        </div>
      )}
    </>
  );
}
