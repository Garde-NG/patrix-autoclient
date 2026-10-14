"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** Popover menu that scales from its trigger (anchored origin), never from its own centre. */
export function Menu({ trigger, items, align = "end", className }: { trigger: ReactNode; items: MenuItem[]; align?: "start" | "end"; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.28 }}
            style={{ originX: align === "end" ? 1 : 0, originY: 0 }}
            className={cn(
              "material-strong material-edge absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-[14px] border border-separator p-1.5 shadow-2",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex min-h-10 w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[14px] transition-colors hover:bg-fill disabled:opacity-40",
                  item.danger ? "text-danger" : "text-text",
                )}
              >
                {item.icon ? <span className="shrink-0 text-text-2 [&>svg]:size-4">{item.icon}</span> : null}
                {item.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
