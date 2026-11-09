"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowLeftRight, Expand, ExternalLink, Images } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import Link from "next/link";
type Work = {
  id: string;
  title: string;
  category: string;
  beforeImage: string;
  afterImage: string;
  description: string;
};
export function Comparison({
  before,
  after,
  title,
}: {
  before: string;
  after: string;
  title: string;
}) {
  const [pos, setPos] = useState(50);
  return (
    <div className="comparison">
      <Image
        src={after}
        fill
        alt={title + " — после чистки"}
        sizes="(max-width: 700px) 100vw, 50vw"
      />
      <div
        className="comparison-before"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image
          src={before}
          fill
          alt={title + " — до чистки"}
          sizes="(max-width: 700px) 100vw, 50vw"
        />
      </div>
      <span className="compare-tag before">До</span>
      <span className="compare-tag after">После</span>
      <div className="compare-line" style={{ left: pos + "%" }}>
        <span>
          <ArrowLeftRight size={19} />
        </span>
      </div>
      <input
        type="range"
        min="2"
        max="98"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={"Сравнение до и после: " + title}
      />
    </div>
  );
}
export function PortfolioGallery({
  items,
  compact = false,
}: {
  items: Work[];
  compact?: boolean;
}) {
  const [filter, setFilter] = useState("Все"),
    [selected, setSelected] = useState<Work | null>(null);
  const cats = ["Все", ...new Set(items.map((x) => x.category))];
  return (
    <>
      <div className="filter-tabs">
        {cats.map((c) => (
          <button
            key={c}
            className={filter === c ? "selected" : ""}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {items.length ? (
        <div className={"work-grid " + (compact ? "compact" : "")}>
          {items
            .filter((x) => filter === "Все" || x.category === filter)
            .slice(0, compact ? 1 : 99)
            .map((x) => (
              <article key={x.id}>
                <Comparison
                  before={x.beforeImage}
                  after={x.afterImage}
                  title={x.title}
                />
                <div className="work-caption">
                  <div>
                    <h3>{x.title}</h3>
                    <p>{x.description}</p>
                  </div>
                  <button
                    aria-label="Открыть во весь экран"
                    onClick={() => setSelected(x)}
                  >
                    <Expand size={18} />
                  </button>
                </div>
              </article>
            ))}
        </div>
      ) : (
        <div className="portfolio-source">
          <Image
            src="/images/sofa.jpg"
            alt="Иллюстрация мягкой мебели"
            fill
            sizes="(max-width:700px) 100vw, 45vw"
          />
          <div className="portfolio-source-shade" />
          <div className="portfolio-source-content">
            <span className="eyebrow">РЕЗУЛЬТАТ В ДЕТАЛЯХ</span>
            <h3>
              У каждой ткани —<br />
              своя история чистоты.
            </h3>
            <p>Работы до и после — в официальной галерее компании.</p>
            <a
              href="https://mos-drycleaning.ru/projects/"
              target="_blank"
              rel="noreferrer"
            >
              Смотреть портфолио
              <ExternalLink size={15} />
            </a>
          </div>
          <span className="image-note">Фото интерьера · иллюстрация</span>
        </div>
      )}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="gallery-dialog">
          <DialogTitle>{selected?.title}</DialogTitle>
          <DialogDescription>{selected?.description}</DialogDescription>
          {selected && (
            <Comparison
              before={selected.beforeImage}
              after={selected.afterImage}
              title={selected.title}
            />
          )}
          <Link className="btn btn-green" href="/booking">
            Заказать чистку
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}
