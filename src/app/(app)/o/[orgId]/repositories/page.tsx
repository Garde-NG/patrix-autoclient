"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FolderGit2, Lock, Plus } from "lucide-react";
import { ConnectRepositorySheet } from "@/components/repositories/connect-sheet";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, MockBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { ListShell } from "@/components/shared/list-shell";
import { useRepositories } from "@/lib/api/hooks/repositories";
import { useListParams } from "@/lib/hooks/use-list-params";
import { pluralize, timeAgo } from "@/lib/utils";

const DEFAULTS = {};

export default function RepositoriesPage() {
  const { orgId, isAdmin } = useOrgContext();
  const { params, setPage } = useListParams(DEFAULTS);
  const query = useRepositories(orgId, { page: params.page, page_size: 20 });
  const [connecting, setConnecting] = useState(false);

  return (
    <>
      <PageHeader
        title="Repositories"
        description="Connected repositories are scanned for the third-party APIs and SDKs they use, so changes can be mapped to your code."
        actions={isAdmin ? <Button leading={<Plus className="size-4" />} onClick={() => setConnecting(true)}>Connect</Button> : null}
      />
      <ListShell
        query={query}
        onPage={setPage}
        empty={
          <EmptyState
            icon={FolderGit2}
            title="No repositories connected"
            description="Link your GitHub App installation and pick a repository. AutoAPI only reads code and opens pull requests for review."
            action={isAdmin ? <Button onClick={() => setConnecting(true)}>Connect a repository</Button> : undefined}
          />
        }
      >
        {(items) => (
          <ListGroup>
            {items.map((r, i) => (
              <Link key={r.id} href={`/o/${orgId}/repositories/${r.id}`} className="pressable-row rise-in flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2" style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-fill text-text-2">
                  <FolderGit2 className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-text">{r.full_name}</span>
                    {r.is_private ? <Lock className="size-3.5 shrink-0 text-text-3" aria-label="Private" /> : null}
                    <MockBadge show={r.is_mock} />
                  </span>
                  <span className="t-footnote block text-text-2">
                    {r.selected_branch} · {pluralize(r.integrations_count, "integration")} ·{" "}
                    <span className={r.open_findings_count ? "text-warning" : ""}>{pluralize(r.open_findings_count, "open finding")}</span>
                  </span>
                  <span className="t-caption block text-text-3">{r.last_scan_at ? `Scanned ${timeAgo(r.last_scan_at)}` : "First scan pending"}</span>
                </span>
                {!r.is_active ? <Badge>Paused</Badge> : <StatusBadge status={r.connection_status} />}
                <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
              </Link>
            ))}
          </ListGroup>
        )}
      </ListShell>
      <ConnectRepositorySheet orgId={orgId} open={connecting} onClose={() => setConnecting(false)} />
    </>
  );
}
