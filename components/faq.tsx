"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
export function FAQList({
  items,
}: {
  items: { id?: string; question: string; answer: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();
  return (
    <div className="faq-list">
      {items.map((f, i) => (
        <div
          className={"faq-item " + (open === i ? "is-open" : "")}
          key={f.id ?? i}
        >
          <button
            aria-expanded={open === i}
            aria-controls={"faq-" + i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {f.question}
            {open === i ? <Minus size={20} /> : <Plus size={20} />}
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                id={"faq-" + i}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.2 }}
              >
                <p>{f.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
