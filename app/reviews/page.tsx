import { db } from "@/lib/db";
import { PageIntro } from "@/components/shared";
import { Reviews } from "@/components/catalog";
export const metadata = {
  title: "Отзывы клиентов",
  alternates: { canonical: "/reviews" },
};
export default async function Page() {
  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Отзывы"
        title="Доверие, которое не придумать."
        description="Опыт клиентов — лучший способ познакомиться с нашей работой."
      />
      <Reviews
        items={await db.review.findMany({
          where: { published: true, verified: true },
          orderBy: { createdAt: "desc" },
        })}
      />
    </div>
  );
}
