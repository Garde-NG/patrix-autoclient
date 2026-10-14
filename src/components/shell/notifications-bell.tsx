"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, CheckCheck } from "lucide-react";
import { useMarkAllRead, useMarkNotificationRead, useNotifications, useUnreadCount } from "@/lib/api/hooks/notifications";
import { useOrgContext } from "./org-provider";
import { Button, IconButton } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { notificationHref } from "@/components/notifications/notification-link";

export function NotificationsBell() {
  const { orgId } = useOrgContext();
  const unread = useUnreadCount(orgId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const recent = useNotifications(orgId, { page_size: 8 });
  const markRead = useMarkNotificationRead(orgId);
  const markAll = useMarkAllRead(orgId);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = unread.data ?? 0;

  return (
    <div ref={ref} className="relative">
      <IconButton
        onClick={() => setOpen((v) => !v)}
        className="relative"
        aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="size-[19px]" strokeWidth={1.9} />
        {count > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-canvas">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </IconButton>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: "blur(4px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            style={{ originX: 1, originY: 0 }}
            className="material-strong material-edge absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-[16px] border border-separator shadow-2"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="t-headline text-text">Notifications</p>
              <Button variant="ghost" size="sm" leading={<CheckCheck className="size-4" />} onClick={() => markAll.mutate()} disabled={!count || markAll.isPending}>
                Mark all read
              </Button>
            </div>
            <ul className="scroll-thin max-h-[60vh] divide-y divide-separator overflow-y-auto border-t border-separator">
              {recent.isPending ? (
                <li className="t-footnote px-4 py-6 text-center text-text-2">Loading…</li>
              ) : !recent.data?.items.length ? (
                <li className="t-footnote px-4 py-8 text-center text-text-2">You&apos;re all caught up.</li>
              ) : (
                recent.data.items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={notificationHref(orgId, n)}
                      onClick={() => {
                        if (!n.read_at) markRead.mutate(n.id);
                        setOpen(false);
                      }}
                      className="pressable-row flex gap-3 px-4 py-3 hover:bg-fill"
                    >
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
            <Link href={`/o/${orgId}/notifications`} onClick={() => setOpen(false)} className="block border-t border-separator px-4 py-2.5 text-center text-[13px] font-medium text-accent hover:bg-fill">
              See all
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
