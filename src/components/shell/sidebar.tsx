"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LogOut, Plus, UserRound } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { useOrgs } from "@/lib/api/hooks/orgs";
import { useSignOut } from "@/lib/api/hooks/account";
import { cn, humanize } from "@/lib/utils";
import { AppearanceRow } from "./appearance-toggle";
import { activeSegment, NAV } from "./nav";
import { useOrgContext } from "./org-provider";
import { useUser } from "./user-provider";

const GROUPS: Array<{ key: "monitor" | "deliver" | "workspace"; label: string }> = [
  { key: "monitor", label: "Monitor" },
  { key: "deliver", label: "Deliver" },
  { key: "workspace", label: "Workspace" },
];

export function Sidebar() {
  const { org, orgId } = useOrgContext();
  const pathname = usePathname();
  const active = activeSegment(pathname, orgId);

  return (
    <aside className="material hidden w-[264px] shrink-0 flex-col border-r border-separator lg:sticky lg:top-0 lg:flex lg:h-dvh">
      <div className="px-4 pt-5 pb-3">
        <Link href="/orgs" className="pressable inline-block rounded-lg">
          <Wordmark />
        </Link>
      </div>
      <div className="px-3 pb-3">
        <OrgSwitcher />
      </div>
      <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
        {GROUPS.map((group) => (
          <div key={group.key} className="mb-4">
            <p className="t-caption mb-1 px-3 font-semibold uppercase tracking-wider text-text-3">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {NAV.filter((n) => n.group === group.key).map((item) => {
                const isActive = active === item.segment;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href(orgId)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "pressable flex h-9 items-center gap-2.5 rounded-[10px] px-3 text-[14px] font-medium transition-colors",
                        isActive ? "bg-accent-soft text-accent" : "text-text-2 hover:bg-fill hover:text-text",
                      )}
                    >
                      <item.icon className="size-[18px]" strokeWidth={isActive ? 2.25 : 1.9} aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-separator px-3 py-3">
        <AppearanceRow className="mb-3 px-2" />
        <p className="t-caption mb-2 px-3 text-text-3">{humanize(org.plan_code)} plan</p>
        <UserMenu />
      </div>
    </aside>
  );
}

export function OrgSwitcher({ compact }: { compact?: boolean }) {
  const { org, orgId } = useOrgContext();
  const orgs = useOrgs();
  const router = useRouter();
  const items = [
    ...(orgs.data ?? []).map((o) => ({
      label: (
        <span className="flex w-full items-center justify-between gap-3">
          <span className="truncate">{o.name}</span>
          {o.id === orgId ? <Check className="size-4 text-accent" /> : null}
        </span>
      ),
      icon: <Avatar name={o.name} seed={o.id} size="sm" />,
      onSelect: () => router.push(`/o/${o.id}`),
    })),
    { label: "New workspace", icon: <Plus />, onSelect: () => router.push("/orgs?new=1") },
  ];
  return (
    <Menu
      align="start"
      className={compact ? undefined : "w-full"}
      items={items}
      trigger={
        <button
          type="button"
          className={cn(
            "pressable flex w-full items-center gap-2.5 rounded-[12px] border border-separator bg-surface px-2.5 py-2 text-left shadow-1 hover:bg-surface-2",
            compact && "w-auto border-0 bg-transparent px-1 shadow-none hover:bg-fill",
          )}
          aria-label="Switch workspace"
        >
          <Avatar name={org.name} seed={org.id} size="sm" />
          {!compact ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-text">{org.name}</span>
              <span className="t-caption block truncate text-text-2">{humanize(org.role)}</span>
            </span>
          ) : null}
          <ChevronsUpDown className="size-4 shrink-0 text-text-3" aria-hidden />
        </button>
      }
    />
  );
}

export function UserMenu({ compact }: { compact?: boolean }) {
  const user = useUser();
  const router = useRouter();
  const signOut = useSignOut();
  return (
    <div className={cn("flex items-center gap-2", compact ? "" : "justify-between")}>
      <Menu
        align={compact ? "end" : "start"}
        items={[
          { label: "Account", icon: <UserRound />, onSelect: () => router.push("/account") },
          { label: "Sign out", icon: <LogOut />, onSelect: () => signOut.mutate(), danger: true },
        ]}
        trigger={
          <button type="button" className={cn("pressable flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left hover:bg-fill", compact && "size-11 justify-center p-0 rounded-full")} aria-label="Account menu">
            <Avatar name={user.name} seed={user.id} size="sm" />
            {!compact ? (
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-text">{user.name}</span>
                <span className="t-caption block truncate text-text-2">{user.email}</span>
              </span>
            ) : null}
          </button>
        }
      />
    </div>
  );
}
