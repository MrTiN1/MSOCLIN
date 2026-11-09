import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/shared";
import { Analytics } from "@/components/analytics";
import { getCompany } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "МОС ХИМЧИСТКА — чистота, которую чувствуешь",
    template: "%s | МОС ХИМЧИСТКА",
  },
  description:
    "Выездная химчистка мягкой мебели, ковров, матрасов и штор в Москве и Московской области. Прозрачный расчёт стоимости и онлайн-запись.",
  openGraph: {
    locale: "ru_RU",
    type: "website",
    siteName: "МОС ХИМЧИСТКА",
    images: [{ url: "/images/hero.jpg", width: 1920, height: 1440 }],
  },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f0e",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const info = await getCompany();
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Перейти к содержимому
        </a>
        <Header info={info} />
        <main id="main">{children}</main>
        <Footer info={info} />
        <Analytics />
      </body>
    </html>
  );
}
