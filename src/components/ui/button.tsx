"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "tinted" | "ghost" | "danger" | "danger-tinted";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.12)]",
  secondary: "bg-surface text-text border border-separator hover:bg-surface-2 shadow-1",
  tinted: "bg-accent-soft text-accent hover:bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]",
  ghost: "bg-transparent text-accent hover:bg-fill",
  danger: "bg-danger text-white hover:brightness-105",
  "danger-tinted": "bg-danger-soft text-danger hover:bg-[color-mix(in_srgb,var(--danger)_20%,transparent)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[9px] gap-1.5",
  md: "h-10 px-4 text-[15px] rounded-[11px] gap-2",
  lg: "h-12 px-5 text-[16px] rounded-[13px] gap-2",
  icon: "h-10 w-10 rounded-full",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, leading, trailing, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "pressable inline-flex select-none items-center justify-center whitespace-nowrap font-medium disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leading}
      {children}
      {trailing}
    </button>
  );
});
