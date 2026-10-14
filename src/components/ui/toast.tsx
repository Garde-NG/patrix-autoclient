"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: Kind;
  title: string;
  description?: string;
}

type Listener = (t: Omit<Toast, "id">) => void;
let listener: Listener | null = null;

/** Imperative API usable outside React (e.g. in the QueryClient caches). */
export const toast = {
  success: (title: string, description?: string) => listener?.({ kind: "success", title, description }),
  error: (title: string, description?: string) => listener?.({ kind: "error", title, description }),
  info: (title: string, description?: string) => listener?.({ kind: "info", title, description }),
};

const Ctx = createContext<{ dismiss: (id: number) => void } | null>(null);

const icons: Record<Kind, ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success" aria-hidden />,
  error: <XCircle className="size-5 text-danger" aria-hidden />,
  info: <Info className="size-5 text-accent" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  useEffect(() => {
    let seq = 0;
    listener = (t) => {
      const id = ++seq;
      // Identical consecutive messages collapse instead of stacking.
      setItems((list) => (list.some((x) => x.title === t.title && x.kind === t.kind) ? list : [...list.slice(-3), { ...t, id }]));
      window.setTimeout(() => dismiss(id), t.kind === "error" ? 6500 : 4000);
    };
    return () => {
      listener = null;
    };
  }, [dismiss]);

  const value = useMemo(() => ({ dismiss }), [dismiss]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-5"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              role={t.kind === "error" ? "alert" : "status"}
              className={cn(
                "material-strong material-edge pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-separator px-4 py-3 shadow-2",
              )}
            >
              <div className="mt-0.5 shrink-0">{icons[t.kind]}</div>
              <div className="min-w-0 flex-1">
                <p className="t-body font-semibold text-text">{t.title}</p>
                {t.description ? <p className="t-footnote mt-0.5 text-text-2">{t.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="pressable -mr-2 -mt-1 flex size-9 items-center justify-center rounded-full text-text-2 hover:bg-fill"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}
