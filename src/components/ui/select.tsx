"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldShell } from "./field";

export interface SelectOption<T extends string = string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** `sm` for filter bars, `md` for forms. */
  size?: "sm" | "md";
  "aria-label"?: string;
  wrapperClassName?: string;
  className?: string;
}

const PAD = 8;

/**
 * Apple-style pop-up button: a rounded trigger showing the current choice with an up/down
 * chevron, opening a list with a checkmark on the selection. Keyboard: arrows, Home/End,
 * type-ahead, Enter/Space to choose, Escape to close. Rendered in a portal so it is never
 * clipped by a scrolling sheet.
 */
export function Select<T extends string = string>({
  value,
  onChange,
  options,
  label,
  hint,
  error,
  required,
  placeholder = "Choose…",
  disabled,
  size = "md",
  "aria-label": ariaLabel,
  wrapperClassName,
  className,
}: SelectProps<T>) {
  const listId = useId();
  const reduce = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean } | null>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const estimated = Math.min(options.length * 40 + 12, 320);
    const up = window.innerHeight - r.bottom < estimated + PAD && r.top > estimated + PAD;
    setPos({ top: up ? r.top - PAD : r.bottom + PAD, left: r.left, width: Math.max(r.width, 200), up });
  }, [options.length]);

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled));
    place();
    setOpen(true);
  };
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);
  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onAny = () => close();
    window.addEventListener("resize", onAny);
    window.addEventListener("scroll", onAny, true);
    return () => {
      window.removeEventListener("resize", onAny);
      window.removeEventListener("scroll", onAny, true);
    };
  }, [open, place, close]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    return () => document.removeEventListener("pointerdown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const move = (from: number, dir: 1 | -1) => {
    let i = from;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => move(a, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => move(a, -1));
        break;
      case "Home":
        e.preventDefault();
        setActive(options.findIndex((o) => !o.disabled));
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1 - [...options].reverse().findIndex((o) => !o.disabled));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          const now = Date.now();
          const t = typeahead.current;
          t.text = now - t.at < 700 ? t.text + e.key.toLowerCase() : e.key.toLowerCase();
          t.at = now;
          const i = options.findIndex((o) => !o.disabled && String(textOf(o.label)).toLowerCase().startsWith(t.text));
          if (i >= 0) setActive(i);
        }
    }
  };

  const trigger = (id: string, describedBy?: string) => (
    <button
      ref={triggerRef}
      id={id}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-label={ariaLabel}
      aria-invalid={!!error}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => (open ? setOpen(false) : openList())}
      onKeyDown={onKeyDown}
      className={cn(
        "pressable flex w-full items-center justify-between gap-2 rounded-[11px] border border-separator bg-surface text-left text-text shadow-1 transition-[border-color,box-shadow] hover:bg-surface-2 focus:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-50",
        size === "sm" ? "h-9 px-3 text-[13px]" : "h-11 px-3.5 text-[15px]",
        error && "border-danger",
        className,
      )}
    >
      <span className={cn("min-w-0 truncate", !selected && "text-text-3")}>{selected ? selected.label : placeholder}</span>
      <ChevronsUpDown className={cn("shrink-0 text-text-2", size === "sm" ? "size-3.5" : "size-4")} aria-hidden />
    </button>
  );

  const list =
    typeof document !== "undefined"
      ? createPortal(
          // No exit animation on purpose: the page re-renders when a filter changes the URL, and an
          // exiting portal element could be left behind invisible and block clicks.
          open && pos ? (
              <motion.div
                ref={listRef}
                id={listId}
                role="listbox"
                aria-activedescendant={`${listId}-${active}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: pos.up ? 4 : -4, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                transition={{ type: "spring", bounce: 0, duration: 0.26 }}
                style={{ position: "fixed", left: pos.left, width: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }), originY: pos.up ? 1 : 0 }}
                className="material-strong material-edge scroll-thin z-[120] max-h-80 overflow-y-auto rounded-[14px] border border-separator p-1.5 shadow-2"
              >
                {options.map((o, i) => {
                  const isSelected = o.value === value;
                  const isActive = i === active;
                  return (
                    <div
                      key={o.value}
                      id={`${listId}-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={o.disabled || undefined}
                      onPointerMove={() => !o.disabled && setActive(i)}
                      onClick={() => choose(i)}
                      className={cn(
                        "flex min-h-10 cursor-default items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[14px]",
                        isActive && !o.disabled ? "bg-accent text-on-accent" : "text-text",
                        o.disabled && "opacity-40",
                      )}
                    >
                      <span className={cn("flex size-4 shrink-0 items-center justify-center", isSelected ? "opacity-100" : "opacity-0")} aria-hidden>
                        <Check className="size-4" strokeWidth={2.5} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{o.label}</span>
                        {o.description ? <span className={cn("block truncate text-[12px]", isActive ? "text-on-accent/80" : "text-text-2")}>{o.description}</span> : null}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            ) : null,
          document.body,
        )
      : null;

  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {({ id, describedBy }) => (
        <>
          {trigger(id, describedBy)}
          {list}
        </>
      )}
    </FieldShell>
  );
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}
