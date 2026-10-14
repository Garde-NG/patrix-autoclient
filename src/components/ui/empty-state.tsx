import type { ReactNode } from "react";
import type { ComponentType } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("card flex flex-col items-center justify-center text-center", compact ? "px-5 py-8" : "px-6 py-14", className)}>
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-fill text-text-2">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
      ) : null}
      <h3 className="t-headline text-text">{title}</h3>
      {description ? <p className="t-footnote mt-1.5 max-w-sm text-text-2">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Couldn't load this"
      description={message}
      className={className}
      compact
      action={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry} leading={<RefreshCw className="size-3.5" />}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}
