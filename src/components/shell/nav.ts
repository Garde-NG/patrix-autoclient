import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CreditCard,
  FolderGit2,
  GitPullRequest,
  LayoutGrid,
  ListChecks,
  Plug,
  Radar,
  Settings,
  ShieldAlert,
  Wrench,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: (orgId: string) => string;
  icon: LucideIcon;
  /** Matches when the pathname starts with this segment under /o/[orgId]. */
  segment: string;
  group: "monitor" | "deliver" | "workspace";
}

export const NAV: NavItem[] = [
  { key: "overview", label: "Overview", href: (o) => `/o/${o}`, icon: LayoutGrid, segment: "", group: "monitor" },
  { key: "findings", label: "Findings", href: (o) => `/o/${o}/findings`, icon: ShieldAlert, segment: "findings", group: "monitor" },
  { key: "changes", label: "API changes", href: (o) => `/o/${o}/changes`, icon: Radar, segment: "changes", group: "monitor" },
  { key: "sources", label: "API sources", href: (o) => `/o/${o}/sources`, icon: Plug, segment: "sources", group: "monitor" },
  { key: "repositories", label: "Repositories", href: (o) => `/o/${o}/repositories`, icon: FolderGit2, segment: "repositories", group: "monitor" },
  { key: "integrations", label: "Integrations", href: (o) => `/o/${o}/integrations`, icon: ListChecks, segment: "integrations", group: "monitor" },
  { key: "repairs", label: "Repairs", href: (o) => `/o/${o}/repairs`, icon: Wrench, segment: "repairs", group: "deliver" },
  { key: "pull-requests", label: "Pull requests", href: (o) => `/o/${o}/pull-requests`, icon: GitPullRequest, segment: "pull-requests", group: "deliver" },
  { key: "jobs", label: "Jobs", href: (o) => `/o/${o}/jobs`, icon: Activity, segment: "jobs", group: "workspace" },
  { key: "notifications", label: "Notifications", href: (o) => `/o/${o}/notifications`, icon: Bell, segment: "notifications", group: "workspace" },
  { key: "billing", label: "Plan & billing", href: (o) => `/o/${o}/billing`, icon: CreditCard, segment: "billing", group: "workspace" },
  { key: "settings", label: "Settings", href: (o) => `/o/${o}/settings`, icon: Settings, segment: "settings", group: "workspace" },
];

/** Phone tab bar: the four destinations people reach for most, plus "More". */
export const TAB_KEYS = ["overview", "findings", "repositories", "sources"] as const;

export function activeSegment(pathname: string, orgId: string): string {
  const base = `/o/${orgId}`;
  if (!pathname.startsWith(base)) return "";
  return pathname.slice(base.length).split("/").filter(Boolean)[0] ?? "";
}

export function titleFor(segment: string): string {
  return NAV.find((n) => n.segment === segment)?.label ?? "AutoAPI";
}
