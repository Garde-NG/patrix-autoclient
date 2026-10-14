import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="pressable mb-2 inline-flex items-center gap-0.5 rounded-md text-[15px] text-accent hover:underline">
            <ChevronLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        ) : null}
        {eyebrow ? <div className="t-caption mb-1 font-semibold uppercase tracking-wide text-text-2">{eyebrow}</div> : null}
        <h1 className="t-display text-text break-words">{title}</h1>
        {description ? <p className="t-body mt-1.5 max-w-2xl text-text-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div> : null}
    </header>
  );
}

export function Section({ title, description, action, children, className }: { title?: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mb-6", className)}>
      {title ? (
        <div className="mb-2.5 flex items-end justify-between gap-3 px-1">
          <div>
            <h2 className="t-headline text-text">{title}</h2>
            {description ? <p className="t-footnote text-text-2">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone, href }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: "danger" | "warning" | "success" | "accent"; href?: string }) {
  const body = (
    <>
      <p className="t-footnote text-text-2">{label}</p>
      <p className={cn("mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums", tone === "danger" && "text-danger", tone === "warning" && "text-warning", tone === "success" && "text-success", tone === "accent" && "text-accent", !tone && "text-text")}>
        {value}
      </p>
      {hint ? <p className="t-caption mt-2 text-text-3">{hint}</p> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="card pressable block p-4 hover:bg-surface-2">
        {body}
      </Link>
    );
  }
  return <div className="card p-4">{body}</div>;
}

export function Code({ children, className, block }: { children: ReactNode; className?: string; block?: boolean }) {
  if (block) {
    return (
      <pre className={cn("t-mono scroll-thin max-h-[480px] overflow-auto rounded-[12px] bg-surface-2 p-4 text-text whitespace-pre-wrap break-words", className)}>
        {children}
      </pre>
    );
  }
  return <code className={cn("t-mono rounded-[6px] bg-fill px-1.5 py-0.5 text-text", className)}>{children}</code>;
}
