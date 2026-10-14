"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[11px] border border-separator bg-surface px-3.5 text-[15px] text-text placeholder:text-text-3 transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_3px_var(--danger-soft)]";

interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

export function FieldShell({ label, hint, error, required, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="t-footnote font-medium text-text-2">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      {children({ id, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="t-footnote text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="t-footnote text-text-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, wrapperClassName, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {({ id, describedBy }) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          required={required}
          className={cn(control, "h-11", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, wrapperClassName, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {({ id, describedBy }) => (
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          required={required}
          className={cn(control, "min-h-28 py-2.5 leading-relaxed", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, className, wrapperClassName, children, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {({ id, describedBy }) => (
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            required={required}
            className={cn(control, "h-11 appearance-none pr-10", className)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-2" aria-hidden />
        </div>
      )}
    </FieldShell>
  );
});

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <label htmlFor={id} className="t-body font-medium text-text">
          {label}
        </label>
        {description ? <p className="t-footnote text-text-2">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50",
          checked ? "bg-success" : "bg-fill-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-transform duration-200 ease-[var(--ease-out-quint)]",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
