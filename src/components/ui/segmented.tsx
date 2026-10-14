"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** iOS segmented control: the selection pill springs between options. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  ariaLabel: string;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex max-w-full overflow-x-auto rounded-[11px] bg-fill p-[3px] scroll-thin", className)}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3.5 text-[13px] font-medium transition-colors",
              selected ? "text-text" : "text-text-2 hover:text-text",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={`${id}-pill`}
                className="absolute inset-0 rounded-[9px] bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.35 }}
              />
            ) : null}
            <span className="relative">{opt.label}</span>
            {opt.count !== undefined ? (
              <span className={cn("relative rounded-full px-1.5 text-[11px] tabular-nums", selected ? "bg-fill text-text-2" : "text-text-3")}>{opt.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
