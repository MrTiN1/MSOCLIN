"use client";
import Script from "next/script";
export function track(event: string) {
  const id = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  if (id && /^\d+$/.test(id)) {
    const w = window as unknown as {
      ym?: (id: number, a: string, e: string) => void;
    };
    w.ym?.(Number(id), "reachGoal", event);
  }
}
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  return id && /^\d+$/.test(id) ? (
    <Script
      id="metrika"
      strategy="afterInteractive"
    >{`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${id},'init',{clickmap:false,trackLinks:true,accurateTrackBounce:true,webvisor:false});`}</Script>
  ) : null;
}
