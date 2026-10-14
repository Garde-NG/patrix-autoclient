"use client";

import { usePathname } from "next/navigation";
import { activeSegment, titleFor } from "./nav";
import { AppearanceButton } from "./appearance-toggle";
import { NotificationsBell } from "./notifications-bell";
import { useOrgContext } from "./org-provider";
import { OrgSwitcher, UserMenu } from "./sidebar";

/** Translucent top chrome. On phones it carries the section title; on desktop only the utilities. */
export function TopBar() {
  const { orgId } = useOrgContext();
  const pathname = usePathname();
  const title = titleFor(activeSegment(pathname, orgId));
  return (
    <header className="material sticky top-0 z-40 border-b border-separator">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <OrgSwitcher compact />
          <h1 className="truncate text-[17px] font-semibold tracking-[-0.015em] text-text">{title}</h1>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-0.5">
          <AppearanceButton />
          <NotificationsBell />
          <div className="lg:hidden">
            <UserMenu compact />
          </div>
        </div>
      </div>
    </header>
  );
}
