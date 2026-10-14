"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button, type ButtonVariant } from "./button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/35 dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !loading && onClose()}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`${id}-t`}
            aria-describedby={description ? `${id}-d` : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6, filter: "blur(4px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="material-strong material-edge relative w-full max-w-sm rounded-[22px] border border-separator p-6 shadow-3"
          >
            <h2 id={`${id}-t`} className="t-headline text-center text-text">
              {title}
            </h2>
            {description ? (
              <p id={`${id}-d`} className="t-footnote mt-2 text-center text-text-2">
                {description}
              </p>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <Button variant="secondary" onClick={onClose} disabled={loading} autoFocus={variant.startsWith("danger")}>
                Cancel
              </Button>
              <Button variant={variant} onClick={onConfirm} loading={loading} autoFocus={!variant.startsWith("danger")}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
