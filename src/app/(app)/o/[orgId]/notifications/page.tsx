"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BellOff, CheckCheck, X } from "lucide-react";
import { notificationHref } from "@/components/notifications/notification-link";
import { useOrgContext } from "@/components/shell/org-provider";
import { Button } from "@/components/ui/button";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { ListShell, Toolbar } from "@/components/shared/list-shell";
import { useDismissNotification, useMarkAllRead, useMarkNotificationRead, useNotifications } from "@/lib/api/hooks/notifications";
import { useListParams } from "@/lib/hooks/use-list-params";
import { cn, formatDateTime, humanize } from "@/lib/utils";

const DEFAULTS = { filter: "all" as "all" | "unread" };

export default function NotificationsPage() {
  const { orgId } = useOrgContext();
  const { params, update, setPage } = useListParams(DEFAULTS);
  const filters = useMemo(() => ({ page: params.page, page_size: 20, unread_only: params.filter === "unread" || undefined }), [params]);
  const query = useNotifications(orgId, filters);
  const markRead = useMarkNotificationRead(orgId);
  const markAll = useMarkAllRead(orgId);
  const dismiss = useDismissNotification(orgId);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Breaking changes, repair outcomes and billing events for this workspace."
        actions={
          <Button variant="secondary" leading={<CheckCheck className="size-4" />} onClick={() => markAll.mutate()} loading={markAll.isPending}>
            Mark all read
          </Button>
        }
      />
      <Toolbar>
        <Segmented ariaLabel="Filter" value={params.filter} onChange={(filter) => update({ filter })} options={[{ value: "all", label: "All" }, { value: "unread", label: "Unread" }]} />
      </Toolbar>
      <ListShell query={query} onPage={setPage} empty={<EmptyState icon={BellOff} title={params.filter === "unread" ? "Nothing unread" : "No notifications"} description="You'll hear about breaking changes and repair results here." />}>
        {(items) => (
          <ListGroup>
            {items.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3.5">
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-accent")} aria-hidden />
                <Link href={notificationHref(orgId, n)} onClick={() => !n.read_at && markRead.mutate(n.id)} className="min-w-0 flex-1">
                  <span className={cn("block text-[15px]", n.read_at ? "text-text-2" : "font-semibold text-text")}>{n.title}</span>
                  <span className="t-footnote block text-text-2">{n.body}</span>
                  <span className="t-caption mt-1 block text-text-3">
                    {humanize(n.type)} · {formatDateTime(n.created_at)}
                  </span>
                </Link>
                <button type="button" onClick={() => dismiss.mutate(n.id)} className="pressable -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-text-3 hover:bg-fill hover:text-text" aria-label="Dismiss">
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </ListGroup>
        )}
      </ListShell>
    </>
  );
}
