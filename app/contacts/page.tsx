import { getCompany } from "@/lib/catalog";
import { PageIntro } from "@/components/shared";
import { CallbackForm } from "@/components/callback-form";
import { Phone, Mail, MapPin, Clock3, Send, ArrowUpRight } from "lucide-react";
export const metadata = {
  title: "Контакты",
  alternates: { canonical: "/contacts" },
};
export default async function Page() {
  const c = await getCompany();
  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Контакты"
        title="Мы рядом. И на связи."
        description="Обсудим вашу задачу, поможем с выбором услуги и удобного времени."
      />
      <div className="contact-grid">
        <section className="contact-info">
          <a className="contact-phone" href={"tel:" + c.tel}>
            {c.phone}
            <ArrowUpRight />
          </a>
          <div className="contact-line">
            <Mail />
            <div>
              <span>НАПИШИТЕ НАМ</span>
              <a href={"mailto:" + c.email}>{c.email}</a>
            </div>
          </div>
          <div className="contact-line">
            <MapPin />
            <div>
              <span>АДРЕС ОФИСА</span>
              <p>{c.address}</p>
            </div>
          </div>
          <div className="contact-line">
            <Clock3 />
            <div>
              <span>МЫ НА СВЯЗИ</span>
              <p>{c.hours}. Заявки на сайте — круглосуточно.</p>
            </div>
          </div>
          <a
            href={c.telegram}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            <Send size={18} />
            Написать в Telegram
            <ArrowUpRight size={17} />
          </a>
          <div className="map-card">
            <iframe
              title="Офис МОС ХИМЧИСТКА на Яндекс Картах"
              src="https://yandex.ru/map-widget/v1/?text=Москва%20Большая%20Грузинская%2030А%20стр%201&z=16"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <a
              href="https://yandex.ru/maps/?text=Москва%20Большая%20Грузинская%2030А%20стр%201"
              target="_blank"
              rel="noreferrer"
            >
              Открыть маршрут
              <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
        <section className="contact-form-card">
          <span className="eyebrow">ДАВАЙТЕ ОБСУДИМ</span>
          <h2>Остались вопросы?</h2>
          <p>Оставьте контакты — менеджер свяжется с вами.</p>
          <CallbackForm />
        </section>
      </div>
    </div>
  );
}
