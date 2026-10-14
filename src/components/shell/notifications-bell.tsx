"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { Bell, CheckCheck } from "lucide-react";
import { useMarkAllRead, useMarkNotificationRead, useNotifications, useUnreadCount } from "@/lib/api/hooks/notifications";
import { useAnchoredPosition, useIsPhone } from "@/lib/hooks/use-anchored-position";
import { useOrgContext } from "./org-provider";
import { Button, IconButton } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn, timeAgo } from "@/lib/utils";
import { notificationHref } from "@/components/notifications/notification-link";
import type { Notification } from "@/lib/api/types";

/**
 * Notifications: a popover anchored to the bell on wide screens (kept inside the viewport,
 * flipping and shrinking as needed) and a bottom sheet on phones, where a popover would
 * never fit well.
 */
export function NotificationsBell() {
  const { orgId } = useOrgContext();
  const unread = useUnreadCount(orgId);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const phone = useIsPhone();
  const pos = useAnchoredPosition(anchorRef, open && !phone, { align: "end", minWidth: 380, maxHeight: 520 });
  const recent = useNotifications(orgId, { page_size: 8 });
  const markRead = useMarkNotificationRead(orgId);
  const markAll = useMarkAllRead(orgId);
  const count = unread.data ?? 0;

  useEffect(() => {
    if (!open || phone) return;
    const onDown = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, phone]);

  const onOpenItem = (n: Notification) => {
    if (!n.read_at) markRead.mutate(n.id);
    setOpen(false);
  };

  const list = (
    <ul className="divide-y divide-separator">
      {recent.isPending ? (
        <li className="t-footnote px-4 py-6 text-center text-text-2">Loading…</li>
      ) : !recent.data?.items.length ? (
        <li className="t-footnote px-4 py-8 text-center text-text-2">You&apos;re all caught up.</li>
      ) : (
        recent.data.items.map((n) => (
          <li key={n.id}>
            <Link href={notificationHref(orgId, n)} onClick={() => onOpenItem(n)} className="pressable-row flex gap-3 px-4 py-3 hover:bg-fill">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-accent")} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-[14px]", n.read_at ? "text-text-2" : "font-semibold text-text")}>{n.title}</span>
                <span className="t-footnote line-clamp-2 text-text-2">{n.body}</span>
                <span className="t-caption mt-0.5 block text-text-3">{timeAgo(n.created_at)}</span>
              </span>
            </Link>
          </li>
        ))
      )}
    </ul>
  );

  const markAllButton = (
    <Button variant="ghost" size="sm" leading={<CheckCheck className="size-4" />} onClick={() => markAll.mutate()} disabled={!count || markAll.isPending}>
      Mark all read
    </Button>
  );

  const seeAll = (
    <Link href={`/o/${orgId}/notifications`} onClick={() => setOpen(false)} className="block py-2.5 text-center text-[14px] font-medium text-accent hover:bg-fill">
      See all notifications
    </Link>
  );

  return (
    <div ref={anchorRef} className="relative">
      <IconButton onClick={() => setOpen((v) => !v)} className="relative" aria-label={count ? `Notifications, ${count} unread` : "Notifications"} aria-expanded={open}>
        <Bell className="size-[19px]" strokeWidth={1.9} />
        {count > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-canvas">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </IconButton>

      {phone ? (
        <Sheet open={open} onClose={() => setOpen(false)} title="Notifications" footer={seeAll}>
          <div className="-mx-5">
            <div className="flex justify-end px-3 pb-2">{markAllButton}</div>
            <div className="border-t border-separator">{list}</div>
          </div>
        </Sheet>
      ) : typeof document !== "undefined" && open && pos ? (
        createPortal(
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            style={{ ...pos.style, originX: pos.originX, originY: pos.originY }}
            className="material-strong material-edge z-[120] flex flex-col overflow-hidden rounded-[16px] border border-separator shadow-2"
          >
            <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
              <p className="t-headline text-text">Notifications</p>
              {markAllButton}
            </div>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto border-t border-separator">{list}</div>
            <div className="shrink-0 border-t border-separator">{seeAll}</div>
          </motion.div>,
          document.body,
        )
      ) : null}
    </div>
  );
}
