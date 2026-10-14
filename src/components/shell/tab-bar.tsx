"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { activeSegment, NAV, TAB_KEYS } from "./nav";
import { useOrgContext } from "./org-provider";

/** Phone navigation: a translucent tab bar content scrolls beneath, plus a "More" sheet. */
export function TabBar() {
  const { orgId } = useOrgContext();
  const pathname = usePathname();
  const active = activeSegment(pathname, orgId);
  const [more, setMore] = useState(false);
  const tabs = TAB_KEYS.map((k) => NAV.find((n) => n.key === k)!);
  const rest = NAV.filter((n) => !TAB_KEYS.includes(n.key as (typeof TAB_KEYS)[number]));
  const moreActive = rest.some((n) => n.segment === active);

  return (
    <>
      <nav className="material safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-separator lg:hidden" aria-label="Primary">
        <ul className="grid h-[58px] grid-cols-5">
          {tabs.map((item) => {
            const isActive = active === item.segment;
            return (
              <li key={item.key}>
                <Link
                  href={item.href(orgId)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn("pressable flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium", isActive ? "text-accent" : "text-text-2")}
                >
                  <item.icon className="size-[23px]" strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
                  {item.label.split(" ")[0] === "API" ? item.label.split(" ")[1].replace(/^./, (c) => c.toUpperCase()) : item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMore(true)}
              className={cn("pressable flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium", moreActive ? "text-accent" : "text-text-2")}
              aria-haspopup="dialog"
            >
              <Ellipsis className="size-[23px]" strokeWidth={moreActive ? 2.2 : 1.8} aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="More">
        <ul className="grid grid-cols-2 gap-2 pb-2">
          {rest.map((item) => {
            const isActive = active === item.segment;
            return (
              <li key={item.key}>
                <Link
                  href={item.href(orgId)}
                  onClick={() => setMore(false)}
                  className={cn(
                    "pressable flex items-center gap-3 rounded-[14px] border border-separator p-3.5 text-[14px] font-medium",
                    isActive ? "bg-accent-soft text-accent border-transparent" : "bg-surface-2 text-text",
                  )}
                >
                  <item.icon className="size-5" strokeWidth={1.9} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
