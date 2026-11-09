"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state page-shell">
      <h1>Не удалось загрузить страницу.</h1>
      <p>
        Попробуйте ещё раз. Если ошибка повторится, свяжитесь с нами по
        телефону.
      </p>
      <button className="btn btn-green" onClick={reset}>
        Попробовать снова
      </button>
    </div>
  );
}
