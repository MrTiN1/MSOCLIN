import { db } from "@/lib/db";
import { PageIntro, PromotionBanner } from "@/components/shared";
import { PortfolioGallery } from "@/components/portfolio";
export const metadata = {
  title: "Наши работы",
  alternates: { canonical: "/portfolio" },
};
export default async function Page() {
  const items = await db.portfolioItem.findMany({
    where: { published: true, rightsConfirmed: true },
  });
  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Портфолио"
        title="Разницу видно в деталях."
        description={
          items.length
            ? "Результаты бережной химчистки. Двигайте разделитель на фотографиях, чтобы сравнить состояние до и после."
            : "Посмотрите работы компании в официальной галерее. Фотографии до и после открываются по ссылке ниже."
        }
      />
      <PortfolioGallery items={items} />
      <PromotionBanner />
    </div>
  );
}
