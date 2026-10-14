"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { useAnchoredPosition } from "@/lib/hooks/use-anchored-position";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * Pull-down menu anchored to its trigger. Rendered in a portal with fixed positioning, so it
 * opens upward when it sits near the bottom of the screen (the sidebar user menu), never
 * leaves the viewport horizontally, and follows the trigger while the page scrolls.
 * Keyboard: arrows, Home/End, Enter, Escape.
 */
export function Menu({ trigger, items, align = "end", className }: { trigger: ReactNode; items: MenuItem[]; align?: "start" | "end"; className?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const pos = useAnchoredPosition(anchorRef, open, { align, minWidth: 220, maxHeight: 420 });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node) && !listRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);

  const enabled = (from: number, dir: 1 | -1) => {
    let i = from;
    for (let n = 0; n < items.length; n++) {
      i = (i + dir + items.length) % items.length;
      if (!items[i].disabled) return i;
    }
    return from;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => enabled(a, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => enabled(a < 0 ? items.length : a, -1));
        break;
      case "Home":
        e.preventDefault();
        setActive(enabled(-1, 1));
        break;
      case "End":
        e.preventDefault();
        setActive(enabled(0, -1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (active >= 0 && !items[active].disabled) {
          setOpen(false);
          items[active].onSelect();
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={anchorRef} className={cn("inline-block", className)}>
      <div
        onClick={() => {
          setActive(-1);
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
      >
        {trigger}
      </div>
      {typeof document !== "undefined" && open && pos
        ? createPortal(
            <motion.div
              ref={listRef}
              id={id}
              role="menu"
              tabIndex={-1}
              onKeyDown={onKeyDown}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", bounce: 0, duration: 0.28 }}
              style={{ ...pos.style, originX: pos.originX, originY: pos.originY }}
              className="material-strong material-edge scroll-thin z-[120] overflow-y-auto rounded-[14px] border border-separator p-1.5 shadow-2 outline-none"
            >
              {items.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  disabled={item.disabled}
                  onPointerMove={() => !item.disabled && setActive(i)}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[14px] transition-colors disabled:opacity-40",
                    active === i && !item.disabled ? (item.danger ? "bg-danger text-white" : "bg-accent text-on-accent") : item.danger ? "text-danger" : "text-text",
                  )}
                >
                  {item.icon ? <span className={cn("shrink-0 [&>svg]:size-4", active === i ? "text-current" : "text-text-2")}>{item.icon}</span> : null}
                  {item.label}
                </button>
              ))}
            </motion.div>,
            document.body,
          )
        : null}
    </div>
  );
}
