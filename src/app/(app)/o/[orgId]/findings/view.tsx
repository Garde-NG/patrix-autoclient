"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
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
          <Select
            size="sm"
            aria-label="Status"
            wrapperClassName="w-48 shrink-0"
            value={params.status}
            onChange={(status) => update({ status })}
            options={[
              { value: "", label: "Any open status" },
              { value: "potential_risk", label: "Potential risk" },
              { value: "likely_impact", label: "Likely impact" },
              { value: "confirmed_incompatibility", label: "Confirmed incompatibility" },
              { value: "repair_available", label: "Repair available" },
              { value: "informational", label: "Informational" },
              { value: "resolved", label: "Resolved" },
              { value: "dismissed", label: "Dismissed" },
            ]}
          />
          <Select
            size="sm"
            aria-label="Kind"
            wrapperClassName="w-44 shrink-0"
            value={params.kind}
            onChange={(kind) => update({ kind })}
            options={[
              { value: "", label: "Any kind" },
              { value: "api_change", label: "API change" },
              { value: "baseline_captured", label: "Baseline captured" },
              { value: "source_unreachable", label: "Source unreachable" },
            ]}
          />
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
