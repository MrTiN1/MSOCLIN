import { admin } from "@/lib/security";
import { AdminApp } from "@/components/admin";
export const metadata = {
  title: "Панель управления",
  robots: { index: false, follow: false },
};
export default async function Page() {
  return <AdminApp authenticated={!!(await admin())} />;
}
