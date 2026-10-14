"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { FilterBar, ListShell, Toolbar } from "@/components/shared/list-shell";
import { useFindings } from "@/lib/api/hooks/findings";
import { useListParams } from "@/lib/hooks/use-list-params";
import type { Finding, Severity } from "@/lib/api/types";
import { humanize, timeAgo } from "@/lib/utils";

type SeverityFilter = "all" | Severity;
type StatusFilter = "" | "potential_risk" | "likely_impact" | "confirmed_incompatibility" | "repair_available" | "resolved" | "dismissed" | "informational";

const DEFAULTS = { severity: "all" as SeverityFilter, status: "" as StatusFilter, kind: "", repository_id: "", source_id: "" };

export default function FindingsPage() {
  const { orgId } = useOrgContext();
  const { params, update, setPage } = useListParams(DEFAULTS);
  const filters = useMemo(
    () => ({
      page: params.page,
      page_size: 20,
      severity: params.severity === "all" ? undefined : params.severity,
      status: params.status || undefined,
      kind: (params.kind || undefined) as Finding["kind"] | undefined,
      repository_id: params.repository_id || undefined,
      source_id: params.source_id || undefined,
      include_dismissed: params.status === "dismissed",
    }),
    [params],
  );
  const query = useFindings(orgId, filters);

  return (
    <>
      <PageHeader title="Findings" description="Actionable items from detected API changes, mapped to the code that uses them. Dismissing keeps the record." />
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
          <Select value={params.status} onChange={(e) => update({ status: e.target.value as StatusFilter })} wrapperClassName="w-44 shrink-0" className="h-9 text-[13px]" aria-label="Status">
            <option value="">Any open status</option>
            <option value="potential_risk">Potential risk</option>
            <option value="likely_impact">Likely impact</option>
            <option value="confirmed_incompatibility">Confirmed incompatibility</option>
            <option value="repair_available">Repair available</option>
            <option value="informational">Informational</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </Select>
          <Select value={params.kind} onChange={(e) => update({ kind: e.target.value })} wrapperClassName="w-40 shrink-0" className="h-9 text-[13px]" aria-label="Kind">
            <option value="">Any kind</option>
            <option value="api_change">API change</option>
            <option value="baseline_captured">Baseline captured</option>
            <option value="source_unreachable">Source unreachable</option>
          </Select>
        </FilterBar>
      </Toolbar>

      <ListShell
        query={query}
        onPage={setPage}
        empty={<EmptyState icon={ShieldCheck} title="Nothing needs your attention" description="No findings match these filters. New findings appear when a monitored API changes or a scan maps a change to your code." />}
      >
        {(items) => (
          <ListGroup>
            {items.map((f, i) => (
              <Link key={f.id} href={`/o/${orgId}/findings/${f.id}`} className="pressable-row rise-in flex items-start gap-3 px-4 py-3.5 hover:bg-surface-2" style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}>
                <span className={`mt-[7px] size-2.5 shrink-0 rounded-full ${f.severity === "breaking" ? "bg-danger" : f.severity === "warning" ? "bg-warning" : "bg-text-3"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-text">{f.title}</span>
                  <span className="t-footnote line-clamp-2 text-text-2">{f.summary}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <SeverityBadge severity={f.severity} />
                    <StatusBadge status={f.status} />
                    {f.repository_id ? <Badge>Repository</Badge> : <Badge>{humanize(f.kind)}</Badge>}
                    <Badge tone="neutral">{humanize(f.confidence)} confidence</Badge>
                  </span>
                </span>
                <span className="t-caption shrink-0 pt-1 text-text-3">{timeAgo(f.created_at)}</span>
              </Link>
            ))}
          </ListGroup>
        )}
      </ListShell>
    </>
  );
}
