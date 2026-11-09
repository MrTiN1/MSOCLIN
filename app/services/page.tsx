import { getServices, getMinimum } from "@/lib/catalog";
import { Catalog } from "@/components/catalog";
import { PageIntro, PromotionBanner } from "@/components/shared";
export const metadata = {
  title: "Услуги и цены",
  alternates: { canonical: "/services" },
};
import { money } from "@/lib/data";
export default async function Page() {
  const minimum = await getMinimum();
  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Услуги"
        title="Чистота для каждой детали."
        description="От любимого кресла до большого офиса. Подберём бережный уход под материал и задачу."
      />
      <Catalog services={await getServices()} />
      <div className="notice">
        Цены «от» — предварительные. Минимальный выезд {money(minimum)}.
        Итоговую стоимость согласуем до начала работ.
      </div>
      <PromotionBanner />
    </div>
  );
}
