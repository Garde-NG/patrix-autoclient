"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Wrench } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { StatusBadge } from "@/components/ui/badge";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { FilterBar, ListShell, Toolbar } from "@/components/shared/list-shell";
import { useRepairs } from "@/lib/api/hooks/repairs";
import { useRepositories } from "@/lib/api/hooks/repositories";
import { useListParams } from "@/lib/hooks/use-list-params";
import type { RepairStatus } from "@/lib/api/types";
import { timeAgo } from "@/lib/utils";

type StatusFilter = "" | RepairStatus;
const DEFAULTS = { status: "" as StatusFilter, repository_id: "" };

export default function RepairsPage() {
  const { orgId } = useOrgContext();
  const { params, update, setPage } = useListParams(DEFAULTS);
  const repos = useRepositories(orgId, { page_size: 100 });
  const filters = useMemo(() => ({ page: params.page, page_size: 20, status: params.status || undefined, repository_id: params.repository_id || undefined }), [params]);
  const query = useRepairs(orgId, filters);
  const repoName = (id: string) => repos.data?.items.find((r) => r.id === id)?.full_name ?? "Repository";

  return (
    <>
      <PageHeader title="Repairs" description="Bounded AI repairs: the agent sees only the files in a finding's evidence, and every patch is verified in a sandbox before it can become a pull request." />
      <Toolbar>
        <FilterBar className="mb-0 flex-nowrap">
          <Segmented
            ariaLabel="Status"
            value={params.status}
            onChange={(status) => update({ status })}
            options={[
              { value: "", label: "All" },
              { value: "verified", label: "Verified" },
              { value: "verification_failed", label: "Failed checks" },
              { value: "delivered", label: "Delivered" },
              { value: "failed", label: "Failed" },
            ]}
          />
          <Select value={params.repository_id} onChange={(e) => update({ repository_id: e.target.value })} wrapperClassName="w-56 shrink-0" className="h-9 text-[13px]" aria-label="Repository">
            <option value="">All repositories</option>
            {repos.data?.items.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name}
              </option>
            ))}
          </Select>
        </FilterBar>
      </Toolbar>
      <ListShell query={query} onPage={setPage} empty={<EmptyState icon={Wrench} title="No repairs yet" description="Open a repository-level finding and choose Request repair. Requires an AI provider configured on the server." />}>
        {(items) => (
          <ListGroup>
            {items.map((r, i) => (
              <Link key={r.id} href={`/o/${orgId}/repairs/${r.id}`} className="pressable-row rise-in flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2" style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-purple-soft text-purple">
                  <Wrench className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-text">{repoName(r.repository_id)}</span>
                  <span className="t-footnote block text-text-2">
                    Attempt {r.attempt_count} of {r.max_attempts} · updated {timeAgo(r.updated_at)}
                  </span>
                  {r.error ? <span className="t-footnote block truncate text-danger">{r.error}</span> : null}
                </span>
                <StatusBadge status={r.status} />
                <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
              </Link>
            ))}
          </ListGroup>
        )}
      </ListShell>
    </>
  );
}
