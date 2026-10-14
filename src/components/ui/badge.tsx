import type { ReactNode } from "react";
import { cn, humanize } from "@/lib/utils";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "purple" | "teal";

const tones: Record<Tone, string> = {
  neutral: "bg-fill text-text-2",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  purple: "bg-purple-soft text-purple",
  teal: "bg-teal-soft text-teal",
};

export function Badge({ tone = "neutral", className, children, dot }: { tone?: Tone; className?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium", tones[tone], className)}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

/** One place that knows which status means what, so colours stay consistent across the app. */
export function toneFor(value: string | null | undefined): Tone {
  switch (value) {
    case "breaking":
    case "failed":
    case "dead":
    case "errored":
    case "confirmed_incompatibility":
    case "verification_failed":
    case "closed":
    case "suspended":
    case "removed":
    case "past_due":
      return "danger";
    case "warning":
    case "potential_risk":
    case "likely_impact":
    case "paused":
    case "pending":
    case "queued":
    case "cancelled":
      return "warning";
    case "succeeded":
    case "verified":
    case "delivered":
    case "merged":
    case "resolved":
    case "active":
    case "completed":
    case "paid":
    case "passed":
    case "done":
      return "success";
    case "repair_available":
    case "generated":
      return "purple";
    case "running":
    case "generating":
    case "verifying":
    case "delivering":
    case "open":
    case "trialing":
      return "accent";
    case "informational":
    case "dismissed":
    case "skipped":
    case "not_configured":
    default:
      return "neutral";
  }
}

const LIVE = new Set(["running", "generating", "verifying", "delivering", "pending", "queued"]);

export function StatusBadge({ status, className, label }: { status: string | null | undefined; className?: string; label?: string }) {
  if (!status) return null;
  return (
    <Badge tone={toneFor(status)} className={className} dot={LIVE.has(status)}>
      <span className={cn(LIVE.has(status) && "[&_+_*]:animate-pulse")}>{label ?? humanize(status)}</span>
    </Badge>
  );
}

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  return (
    <Badge tone={toneFor(severity)} className={className}>
      {humanize(severity)}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={role === "owner" ? "purple" : role === "admin" ? "accent" : "neutral"}>{humanize(role)}</Badge>;
}

export function MockBadge({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <Badge tone="neutral" className="border border-dashed border-separator-strong bg-transparent">
      Mock
    </Badge>
  );
}
