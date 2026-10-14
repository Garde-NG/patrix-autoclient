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

/**
 * One place that knows which status means what, so colours stay consistent across the app.
 * Green = healthy or finished well; red = broken or needs you; amber = waiting or degraded;
 * blue = in progress; purple = a repair is on offer; grey = nothing to act on.
 */
const TONE_BY_STATUS: Record<string, Tone> = {
  // Healthy / finished well
  connected: "success",
  active: "success",
  succeeded: "success",
  verified: "success",
  delivered: "success",
  merged: "success",
  resolved: "success",
  completed: "success",
  paid: "success",
  passed: "success",
  done: "success",
  // Broken / needs attention
  breaking: "danger",
  failed: "danger",
  dead: "danger",
  errored: "danger",
  confirmed_incompatibility: "danger",
  verification_failed: "danger",
  closed: "danger",
  suspended: "danger",
  removed: "danger",
  inaccessible: "danger",
  past_due: "danger",
  unpaid: "danger",
  incomplete_expired: "danger",
  // Waiting / degraded
  warning: "warning",
  potential_risk: "warning",
  likely_impact: "warning",
  paused: "warning",
  pending: "warning",
  queued: "warning",
  cancelled: "warning",
  stale: "warning",
  incomplete: "warning",
  expired: "warning",
  // In progress
  running: "accent",
  generating: "accent",
  verifying: "accent",
  delivering: "accent",
  open: "accent",
  trialing: "accent",
  // A repair is on offer
  repair_available: "purple",
  generated: "purple",
};

export function toneFor(value: string | null | undefined): Tone {
  return (value && TONE_BY_STATUS[value]) || "neutral";
}

const LIVE = new Set(["running", "generating", "verifying", "delivering", "pending", "queued"]);

export function StatusBadge({ status, className, label }: { status: string | null | undefined; className?: string; label?: string }) {
  if (!status) return null;
  const tone = toneFor(status);
  return (
    <Badge tone={tone} className={className} dot={LIVE.has(status) || tone === "success" || tone === "danger"}>
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
