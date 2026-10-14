"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, GitPullRequest } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, MockBadge, StatusBadge } from "@/components/ui/badge";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { FilterBar, ListShell, Toolbar } from "@/components/shared/list-shell";
import { usePullRequests } from "@/lib/api/hooks/pull-requests";
import { useRepositories } from "@/lib/api/hooks/repositories";
import { useListParams } from "@/lib/hooks/use-list-params";
import type { PullRequestState } from "@/lib/api/types";
import { timeAgo } from "@/lib/utils";

type StateFilter = "" | PullRequestState;
const DEFAULTS = { state: "" as StateFilter, repository_id: "" };

export default function PullRequestsPage() {
  const { orgId } = useOrgContext();
  const { params, update, setPage } = useListParams(DEFAULTS);
  const repos = useRepositories(orgId, { page_size: 100 });
  const filters = useMemo(() => ({ page: params.page, page_size: 20, state: params.state || undefined, repository_id: params.repository_id || undefined }), [params]);
  const query = usePullRequests(orgId, filters);
  const repoName = (id: string) => repos.data?.items.find((r) => r.id === id)?.full_name ?? "Repository";

  return (
    <>
      <PageHeader title="Pull requests" description="Pull requests AutoAPI opened for verified repairs. Your team reviews and merges; AutoAPI never does." />
      <Toolbar>
        <FilterBar className="mb-0 flex-nowrap">
          <Segmented
            ariaLabel="State"
            value={params.state}
            onChange={(state) => update({ state })}
            options={[
              { value: "", label: "All" },
              { value: "open", label: "Open" },
              { value: "merged", label: "Merged" },
              { value: "closed", label: "Closed" },
              { value: "failed", label: "Failed" },
            ]}
          />
          <Select
            size="sm"
            aria-label="Repository"
            wrapperClassName="w-60 shrink-0"
            value={params.repository_id}
            onChange={(repository_id) => update({ repository_id })}
            options={[{ value: "", label: "All repositories" }, ...(repos.data?.items.map((r) => ({ value: r.id, label: r.full_name })) ?? [])]}
          />
        </FilterBar>
      </Toolbar>
      <ListShell query={query} onPage={setPage} empty={<EmptyState icon={GitPullRequest} title="No pull requests yet" description="Deliver a verified repair to open one against the watched branch." />}>
        {(items) => (
          <ListGroup>
            {items.map((p, i) => (
              <Link key={p.id} href={`/o/${orgId}/pull-requests/${p.id}`} className="pressable-row rise-in flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2" style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}>
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-[12px] ${p.state === "merged" ? "bg-purple-soft text-purple" : p.state === "open" ? "bg-success-soft text-success" : "bg-fill text-text-2"}`}>
                  <GitPullRequest className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-text">{p.title}</span>
                    <MockBadge show={p.is_mock} />
                    {p.is_draft ? <Badge>Draft</Badge> : null}
                  </span>
                  <span className="t-footnote block truncate text-text-2">
                    {repoName(p.repository_id)}
                    {p.number ? ` #${p.number}` : ""} · {p.branch} → {p.base_branch}
                  </span>
                  <span className="t-caption block text-text-3">{p.opened_at ? `Opened ${timeAgo(p.opened_at)}` : `Created ${timeAgo(p.created_at)}`}</span>
                </span>
                <StatusBadge status={p.state} />
                <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
              </Link>
            ))}
          </ListGroup>
        )}
      </ListShell>
    </>
  );
}
