"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Radar, X } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { FilterBar, ListShell, Toolbar } from "@/components/shared/list-shell";
import { Operation } from "@/components/shared/operation";
import { useChanges } from "@/lib/api/hooks/changes";
import { useSources } from "@/lib/api/hooks/sources";
import { useListParams } from "@/lib/hooks/use-list-params";
import type { Severity } from "@/lib/api/types";
import { humanize, timeAgo } from "@/lib/utils";

type SeverityFilter = "all" | Severity;
const DEFAULTS = { severity: "all" as SeverityFilter, source_id: "", category: "", diff_id: "" };

export default function ChangesPage() {
  const { orgId } = useOrgContext();
  const { params, update, setPage } = useListParams(DEFAULTS);
  const sources = useSources(orgId, { page_size: 100 });
  const filters = useMemo(
    () => ({
      page: params.page,
      page_size: 20,
      severity: params.severity === "all" ? undefined : params.severity,
      source_id: params.source_id || undefined,
      category: params.category || undefined,
      diff_id: params.diff_id || undefined,
    }),
    [params],
  );
  const query = useChanges(orgId, filters);
  const sourceName = (id: string) => sources.data?.items.find((s) => s.id === id)?.name ?? "Source";

  return (
    <>
      <PageHeader title="API changes" description="Every difference between consecutive snapshots of a monitored API, classified deterministically by oasdiff." />
      <Toolbar>
        <FilterBar className="mb-0 flex-nowrap">
          <Segmented
            ariaLabel="Severity"
            value={params.severity}
            onChange={(severity) => update({ severity })}
            options={[
              { value: "all", label: "All" },
              { value: "breaking", label: "Breaking" },
              { value: "warning", label: "Warning" },
              { value: "informational", label: "Info" },
            ]}
          />
          <Select
            size="sm"
            aria-label="Source"
            wrapperClassName="w-52 shrink-0"
            value={params.source_id}
            onChange={(source_id) => update({ source_id })}
            options={[{ value: "", label: "All sources" }, ...(sources.data?.items.map((s) => ({ value: s.id, label: s.name })) ?? [])]}
          />
          {params.diff_id ? (
            <Button variant="tinted" size="sm" className="shrink-0 rounded-full" onClick={() => update({ diff_id: "" })} trailing={<X className="size-3.5" />}>
              One diff run
            </Button>
          ) : null}
        </FilterBar>
      </Toolbar>

      <ListShell query={query} onPage={setPage} empty={<EmptyState icon={Radar} title="No changes detected" description="A change is recorded when two consecutive snapshots of a source differ. Add a source or wait for its next poll." />}>
        {(items) => (
          <ListGroup>
            {items.map((c, i) => (
              <Link key={c.id} href={`/o/${orgId}/changes/${c.id}`} className="pressable-row rise-in flex items-start gap-3 px-4 py-3.5 hover:bg-surface-2" style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}>
                <SeverityBadge severity={c.severity} className="mt-0.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-text">{c.summary}</span>
                  <Operation method={c.operation_method} path={c.operation_path} className="mt-1 max-w-full text-[12.5px]" />
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge>{humanize(c.category)}</Badge>
                    <Badge>{sourceName(c.api_source_id)}</Badge>
                    {c.occurrences > 1 ? <Badge tone="accent">Seen {c.occurrences}×</Badge> : null}
                  </span>
                </span>
                <span className="t-caption shrink-0 pt-1 text-text-3">{timeAgo(c.created_at)}</span>
              </Link>
            ))}
          </ListGroup>
        )}
      </ListShell>
    </>
  );
}
