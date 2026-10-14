"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Desktop width. On phones the sheet is always a bottom sheet. */
  size?: "md" | "lg";
}

/** Apple's momentum projection: where would a flick come to rest? */
function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Bottom sheet on phones (drag-to-dismiss with velocity projection), side panel on desktop.
 * Dismisses along the same path it entered. Interruptible: the spring re-targets from the live value.
 */
export function Sheet({ open, onClose, title, description, children, footer, size = "md" }: SheetProps) {
  const titleId = useId();
  const reduce = useReducedMotion();
  const y = useMotionValue(0);
  const drag = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const focusable = panelRef.current?.querySelector<HTMLElement>("input, textarea, select, button:not([data-close])");
    window.setTimeout(() => focusable?.focus({ preventScroll: true }), 50);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = panelRef.current?.offsetHeight ?? 600;
    const projected = info.offset.y + project(info.velocity.y);
    // Decide by where the gesture is going, not where it let go.
    if (projected > height * 0.4) onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/35 dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            drag={reduce ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.9 }}
            onDragEnd={onDragEnd}
            style={{ y }}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.42 }}
            className={cn(
              "absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[22px] bg-surface shadow-3",
              // Desktop: side panel sliding in from the right, same path out.
              "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-full sm:rounded-none sm:rounded-l-[22px] sm:[--enter:100%]",
              size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
            )}
          >
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 touch-none" onPointerDown={(e) => drag.start(e)}>
              <div className="h-[5px] w-10 rounded-full bg-fill-strong" aria-hidden />
            </div>
            <header className="flex items-start justify-between gap-4 px-5 pt-2 pb-3 sm:pt-5 touch-none" onPointerDown={(e) => drag.start(e)}>
              <div className="min-w-0">
                <h2 id={titleId} className="t-title text-text">
                  {title}
                </h2>
                {description ? <p className="t-footnote mt-1 text-text-2">{description}</p> : null}
              </div>
              <button
                type="button"
                data-close
                onClick={onClose}
                className="pressable flex size-8 shrink-0 items-center justify-center rounded-full bg-fill text-text-2 hover:bg-fill-strong"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
            {footer ? <footer className="safe-bottom border-t border-separator px-5 py-4">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
