"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Apple button styles. One prominent (filled) action per view; everything else tinted, gray
 * or plain. Press feedback is a spring on pointer-down, so it starts instantly and can be
 * cancelled by dragging away, and it is never the only feedback (loading swaps in a spinner).
 *
 *   primary        filled, the one action people are most likely to take
 *   tinted         accent on a soft accent background, secondary emphasis
 *   secondary      gray bezel, neutral actions
 *   ghost          plain accent text, inline actions
 *   danger         filled red, destructive confirms
 *   danger-tinted  red on soft red, destructive but not the default
 */
export type ButtonVariant = "primary" | "secondary" | "tinted" | "ghost" | "danger" | "danger-tinted";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent shadow-[0_1px_2px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-accent-hover",
  secondary: "bg-surface text-text border border-separator shadow-1 hover:bg-surface-2",
  tinted: "bg-accent-soft text-accent hover:bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]",
  ghost: "bg-transparent text-accent hover:bg-fill",
  danger: "bg-danger text-white shadow-[0_1px_2px_rgba(0,0,0,0.14)] hover:brightness-105",
  "danger-tinted": "bg-danger-soft text-danger hover:bg-[color-mix(in_srgb,var(--danger)_20%,transparent)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-[10px] gap-1.5",
  md: "h-11 px-4.5 text-[15px] rounded-[12px] gap-2",
  lg: "h-12 px-5 text-[16px] rounded-[14px] gap-2",
  icon: "size-11 rounded-full",
  "icon-sm": "size-9 rounded-full",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, leading, trailing, children, disabled, type = "button", ...props },
  ref,
) {
  const reduce = useReducedMotion();
  const isDisabled = disabled || loading;
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileTap={isDisabled || reduce ? undefined : { scale: size.startsWith("icon") ? 0.9 : 0.96 }}
      transition={{ type: "spring", bounce: 0, duration: 0.22 }}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold tracking-[-0.01em] transition-[background-color,box-shadow,filter,opacity] duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--accent-soft),0_0_0_1px_var(--accent)] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leading}
      {children}
      {trailing}
    </motion.button>
  );
});

/** Circular icon-only button. Always pass `aria-label`. */
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "size"> & { size?: "md" | "sm"; "aria-label": string }>(function IconButton(
  { size = "md", variant = "ghost", className, ...props },
  ref,
) {
  return <Button ref={ref} variant={variant} size={size === "sm" ? "icon-sm" : "icon"} className={cn("text-text-2 hover:text-text", className)} {...props} />;
});
