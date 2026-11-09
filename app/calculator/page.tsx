import { getServices } from "@/lib/catalog";
import { PageIntro } from "@/components/shared";
import { BookingWizard } from "@/components/booking";
export const metadata = {
  title: "Калькулятор стоимости",
  alternates: { canonical: "/calculator" },
};
export default async function Page() {
  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Калькулятор"
        title="Понятная цена. С первого шага."
        description="Рассчитайте предварительную стоимость по опубликованному прайсу. Без звонков и скрытых доплат."
      />
      <BookingWizard services={await getServices()} mode="calculator" />
    </div>
  );
}
