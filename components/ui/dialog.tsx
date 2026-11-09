"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;
export const DialogTitle = D.Title;
export const DialogDescription = D.Description;
export function DialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof D.Content>) {
  return (
    <D.Portal>
      <D.Overlay className="modal-overlay" />
      <D.Content className={cn("modal-content", className)} {...props}>
        {children}
        <D.Close className="modal-close" aria-label="Закрыть">
          <X size={20} />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
