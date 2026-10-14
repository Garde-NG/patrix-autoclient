"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Check, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   Form primitives. Every control shares FieldShell (label, hint, inline error) so forms read
   the same everywhere. Validation shows inline next to the field, never in an alert.
   --------------------------------------------------------------------------------------------- */

/* Focus keeps the same shape and colour as rest: the border darkens a step and a soft neutral halo
   appears, so the field reads as active without changing its outline or radius. */
export const controlClass =
  "w-full rounded-[11px] border border-separator bg-surface px-3.5 text-[15px] text-text placeholder:text-text-3 transition-[border-color,box-shadow,background-color] duration-150 hover:border-separator-strong focus:border-separator-strong focus:outline-none focus:shadow-[0_0_0_4px_var(--fill)] disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_4px_var(--danger-soft)]";

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
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      {label ? (
        <label htmlFor={id} className="t-footnote mt-1 font-medium text-text-2">
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

/* ------------------------------------------ Input ------------------------------------------ */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, required, className, wrapperClassName, ...props }, ref) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {({ id, describedBy }) => <input ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy} required={required} className={cn(controlClass, "h-11", className)} {...props} />}
    </FieldShell>
  );
});

/* ---------------------------------------- Textarea ---------------------------------------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, required, className, wrapperClassName, ...props }, ref) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {({ id, describedBy }) => <textarea ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy} required={required} className={cn(controlClass, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />}
    </FieldShell>
  );
});

/* --------------------------------------- Search field --------------------------------------- */

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> {
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  wrapperClassName?: string;
}

/** Rounded search field with a magnifier and a clear button, like a toolbar search field. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({ value, onChange, size = "md", className, wrapperClassName, placeholder = "Search", ...props }, ref) {
  return (
    <div className={cn("relative min-w-0", wrapperClassName)}>
      <Search className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-2", size === "sm" ? "size-3.5" : "size-4")} aria-hidden />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-full bg-fill text-text placeholder:text-text-2 transition-[background-color,box-shadow] focus:bg-surface focus:outline-none focus:shadow-[0_0_0_4px_var(--fill),inset_0_0_0_1px_var(--separator-strong)] [&::-webkit-search-cancel-button]:hidden",
          size === "sm" ? "h-9 pl-8 pr-8 text-[13px]" : "h-11 pl-10 pr-10 text-[15px]",
          className,
        )}
        {...props}
      />
      {value ? (
        <button type="button" onClick={() => onChange("")} className="pressable absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-text-2 hover:text-text" aria-label="Clear search">
          <XCircle className="size-4" />
        </button>
      ) : null}
    </div>
  );
});

/* ----------------------------------------- Checkbox ----------------------------------------- */

export function Checkbox({ checked, onChange, label, description, disabled, className }: { checked: boolean; onChange: (next: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean; className?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 py-1", disabled && "cursor-not-allowed opacity-50", className)}>
      <span className="relative mt-0.5 flex size-[22px] shrink-0 items-center justify-center">
        <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className={cn("flex size-[22px] items-center justify-center rounded-[7px] border transition-colors peer-focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]", checked ? "border-accent bg-accent text-on-accent" : "border-separator-strong bg-surface")} aria-hidden>
          {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] text-text">{label}</span>
        {description ? <span className="t-footnote block text-text-2">{description}</span> : null}
      </span>
    </label>
  );
}

/* ------------------------------------------ Switch ------------------------------------------ */

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
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
        className={cn("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50", checked ? "bg-success" : "bg-fill-strong")}
      >
        <span className={cn("absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-transform duration-200 ease-[var(--ease-out-quint)]", checked && "translate-x-5")} />
      </button>
    </div>
  );
}

/* --------------------------------------- Form layout --------------------------------------- */

/** Vertical stack of fields with consistent spacing. */
export function Form({ className, children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form className={cn("flex flex-col gap-5", className)} noValidate {...props}>
      {children}
    </form>
  );
}

/** Grouped section inside a form: an optional caption above a soft inset panel of fields. */
export function FormSection({ title, description, children, className }: { title?: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      {title ? (
        <legend className="t-caption mb-2 px-1 font-semibold uppercase tracking-wide text-text-2">
          {title}
        </legend>
      ) : null}
      <div className="flex flex-col gap-5 rounded-[14px] bg-surface-2 p-4">{children}</div>
      {description ? <p className="t-footnote mt-2 px-1 text-text-2">{description}</p> : null}
    </fieldset>
  );
}

/** Inline error for a whole form (server message without a field). */
export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">
      {message}
    </p>
  );
}

/** Row of actions at the end of a form; primary action trails. */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center justify-end gap-2 pt-1", className)}>{children}</div>;
}
