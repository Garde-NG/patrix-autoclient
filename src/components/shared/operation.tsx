import { cn } from "@/lib/utils";

const METHOD: Record<string, string> = {
  GET: "text-success",
  POST: "text-accent",
  PUT: "text-warning",
  PATCH: "text-warning",
  DELETE: "text-danger",
};

export function Operation({ method, path, className }: { method: string | null; path: string | null; className?: string }) {
  if (!method && !path) return null;
  return (
    <span className={cn("t-mono inline-flex min-w-0 items-baseline gap-1.5", className)}>
      {method ? <span className={cn("shrink-0 font-bold", METHOD[method.toUpperCase()] ?? "text-text-2")}>{method.toUpperCase()}</span> : null}
      {path ? <span className="truncate text-text">{path}</span> : null}
    </span>
  );
}
