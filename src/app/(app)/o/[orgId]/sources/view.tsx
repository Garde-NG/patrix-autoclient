"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plug, Plus } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { SourceSheet } from "@/components/sources/source-form";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { ListShell } from "@/components/shared/list-shell";
import { useSources } from "@/lib/api/hooks/sources";
import { useListParams } from "@/lib/hooks/use-list-params";
import { timeAgo } from "@/lib/utils";

const DEFAULTS = {};

export default function SourcesPage() {
  const { orgId, isAdmin } = useOrgContext();
  const { params, setPage } = useListParams(DEFAULTS);
  const query = useSources(orgId, { page: params.page, page_size: 20 });
  const [adding, setAdding] = useState(false);

  return (
    <>
      <PageHeader
        title="API sources"
        description="The OpenAPI documents AutoAPI watches. Each distinct version becomes a snapshot; consecutive snapshots are diffed."
        actions={isAdmin ? <Button leading={<Plus className="size-4" />} onClick={() => setAdding(true)}>Add source</Button> : null}
      />
      <ListShell
        query={query}
        onPage={setPage}
        empty={
          <EmptyState
            icon={Plug}
            title="No API sources yet"
            description="Add the OpenAPI document of a provider you depend on. Connected repositories also attach known providers automatically."
            action={isAdmin ? <Button onClick={() => setAdding(true)}>Add your first source</Button> : undefined}
          />
        }
      >
        {(items) => (
          <ListGroup>
            {items.map((s, i) => (
              <Link key={s.id} href={`/o/${orgId}/sources/${s.id}`} className="pressable-row rise-in flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2" style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft text-accent">
                  <Plug className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-text">{s.name}</span>
                    <Badge className="hidden sm:inline-flex">{s.provider_key}</Badge>
                  </span>
                  <span className="t-footnote block truncate text-text-2">{s.url ?? "Upload-only"}</span>
                  <span className="t-caption block text-text-3">
                    {s.last_polled_at ? `Checked ${timeAgo(s.last_polled_at)}` : s.url ? "First fetch pending" : "No snapshots yet"}
                    {s.consecutive_failures > 0 ? ` · ${s.consecutive_failures} consecutive failure${s.consecutive_failures === 1 ? "" : "s"}` : ""}
                  </span>
                </span>
                <StatusBadge status={s.status} />
                <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
              </Link>
            ))}
          </ListGroup>
        )}
      </ListShell>
      <SourceSheet orgId={orgId} open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
