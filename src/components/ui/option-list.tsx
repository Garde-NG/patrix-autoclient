"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ListOption<T extends string = string> {
  value: T;
  title: ReactNode;
  description?: ReactNode;
  /** Small trailing text, e.g. a status. */
  meta?: ReactNode;
  leading?: ReactNode;
  disabled?: boolean;
}

/**
 * iOS-style single-choice list: a grouped card of rows with a checkmark on the chosen row.
 * Use it for choosing one of a few rich options (a provider, a repository); use `Select`
 * for compact pop-up choices and `Segmented` for two to four short labels.
 */
export function OptionList<T extends string = string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  emptyLabel = "Nothing to choose from.",
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: ListOption<T>[];
  ariaLabel: string;
  className?: string;
  emptyLabel?: ReactNode;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("card divide-y divide-separator overflow-hidden", className)}>
      {!options.length ? (
        <p className="t-footnote px-4 py-4 text-text-2">{emptyLabel}</p>
      ) : (
        options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={o.disabled}
              onClick={() => onChange(o.value)}
              className={cn(
                "pressable-row flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50",
                selected ? "bg-accent-soft" : "hover:bg-surface-2",
              )}
            >
              {o.leading ? <span className="shrink-0">{o.leading}</span> : null}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[15px] font-medium text-text">{o.title}</span>
                {o.description ? <span className="t-footnote block text-text-2">{o.description}</span> : null}
                {o.meta ? <span className="t-caption block text-text-3">{o.meta}</span> : null}
              </span>
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", selected ? "bg-accent text-on-accent" : "border-2 border-separator-strong")} aria-hidden>
                {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
