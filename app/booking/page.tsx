import { getServices } from "@/lib/catalog";
import { PageIntro } from "@/components/shared";
import { BookingWizard } from "@/components/booking";
export const metadata = {
  title: "Онлайн-запись",
  alternates: { canonical: "/booking" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ price?: string; quantity?: string; extras?: string }>;
}) {
  const q = await searchParams;
  const services = await getServices();
  return (
    <div className="page-shell booking-page">
      <PageIntro
        eyebrow="Онлайн-запись"
        title="Ваш дом. Ваше время."
        description="Выберите услугу и удобное время. Всё остальное мы берём на себя."
      />
      <BookingWizard
        services={services}
        initialPrice={
          services.some((s) => s.prices.some((p) => p.id === q.price))
            ? q.price
            : undefined
        }
        initialQuantity={Math.max(1, Math.min(100, Number(q.quantity) || 1))}
        initialExtras={q.extras
          ?.split(",")
          .filter((x) =>
            [
              "heavy",
              "odor",
              "steam",
              "antistatic",
              "dry",
              "antibacterial",
            ].includes(x),
          )}
      />
    </div>
  );
}
