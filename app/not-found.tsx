import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state page-shell">
      <span className="eyebrow">404</span>
      <h1>Здесь пока ничего нет.</h1>
      <p>Но чистота совсем рядом.</p>
      <Link className="btn btn-green" href="/">
        На главную
      </Link>
    </div>
  );
}
