"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ArrowUpRight, LoaderCircle, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { track } from "./analytics";
export function maskPhone(s: string) {
  let n = s.replace(/\D/g, "");
  if (n[0] === "8") n = "7" + n.slice(1);
  if (n[0] !== "7") n = "7" + n;
  const d = n.slice(1, 11);
  return (
    "+7" +
    (d ? " (" + d.slice(0, 3) : "") +
    (d.length >= 3 ? ") " : "") +
    d.slice(3, 6) +
    (d.length > 6 ? "-" + d.slice(6, 8) : "") +
    (d.length > 8 ? "-" + d.slice(8, 10) : "")
  );
}
const schema = z.object({
  name: z.string().min(2, "Укажите имя"),
  phone: z
    .string()
    .refine(
      (s) => /^[78]\d{10}$/.test(s.replace(/\D/g, "")),
      "Укажите телефон полностью",
    ),
  comment: z.string().max(1500),
  consent: z.boolean().refine(Boolean, "Подтвердите согласие"),
  website: z.string().max(0),
});
export function CallbackForm() {
  const [result, setResult] = useState(""),
    [error, setError] = useState("");
  const f = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      comment: "",
      consent: false,
      website: "",
    },
  });
  async function submit(v: z.infer<typeof schema>) {
    setError("");
    try {
      const token = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (x) => x.toString(16).padStart(2, "0"),
      ).join("");
      const r = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          idempotencyKey: crypto.randomUUID(),
          accessToken: token,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setResult(d.number);
      track("callback_success");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (result)
    return (
      <div className="success-box">
        <span className="round-icon">
          <Check />
        </span>
        <h3>Заявка принята</h3>
        <p>Номер {result}. Менеджер свяжется с вами, чтобы уточнить детали.</p>
      </div>
    );
  return (
    <form className="form-stack" onSubmit={f.handleSubmit(submit)}>
      <label>
        Ваше имя
        <input
          aria-label="Ваше имя"
          aria-invalid={!!f.formState.errors.name}
          autoComplete="given-name"
          placeholder="Как к вам обращаться"
          {...f.register("name")}
        />
        <small className="field-error">
          {f.formState.errors.name?.message}
        </small>
      </label>
      <label>
        Телефон
        <input
          aria-label="Телефон"
          aria-invalid={!!f.formState.errors.phone}
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          {...f.register("phone")}
          onChange={(e) =>
            f.setValue("phone", maskPhone(e.target.value), {
              shouldValidate: false,
            })
          }
        />
        <small className="field-error">
          {f.formState.errors.phone?.message}
        </small>
      </label>
      <label>
        Комментарий <span className="muted">(необязательно)</span>
        <textarea
          placeholder="Что нужно почистить?"
          rows={3}
          {...f.register("comment")}
        />
      </label>
      <input
        className="honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        {...f.register("website")}
      />
      <label className="check-label">
        <input type="checkbox" {...f.register("consent")} />
        <span>
          Согласен на{" "}
          <Link href="/privacy" target="_blank">
            обработку персональных данных
          </Link>
        </span>
      </label>
      <small className="field-error">
        {f.formState.errors.consent?.message}
      </small>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      <Button disabled={f.formState.isSubmitting}>
        {f.formState.isSubmitting ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <Phone size={18} />
        )}
        Оставить заявку
        <ArrowUpRight size={17} />
      </Button>
    </form>
  );
}
export function CallbackButton({
  children = "Заказать звонок",
  variant = "default",
  className = "",
}: {
  children?: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={className} variant={variant}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Оставьте ваш номер</DialogTitle>
        <DialogDescription>
          Обсудим задачу и подберём удобное время для чистки.
        </DialogDescription>
        <CallbackForm />
      </DialogContent>
    </Dialog>
  );
}
