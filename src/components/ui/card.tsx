import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 pb-3", className)}>
      <div className="min-w-0">
        <h2 className="t-headline text-text">{title}</h2>
        {description ? <p className="t-footnote mt-0.5 text-text-2">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

/** iOS-style grouped list: rows separated by inset hairlines. */
export function ListGroup({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card overflow-hidden", className)} {...props}>
      <div className="divide-y divide-separator">{children}</div>
    </div>
  );
}

export function Row({
  className,
  leading,
  trailing,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={cn("flex min-h-[52px] items-center gap-3 px-4 py-3", className)} {...props}>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

export function KeyValue({ label, value, mono }: { label: ReactNode; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="t-body shrink-0 text-text-2">{label}</dt>
      <dd className={cn("t-body min-w-0 text-right text-text break-words", mono && "t-mono")}>{value ?? "—"}</dd>
    </div>
  );
}
