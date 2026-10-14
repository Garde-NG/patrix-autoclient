"use client";

import { use } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, MockBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, KeyValue, ListGroup } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Code, PageHeader, Section } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { messageOf } from "@/lib/api/client";
import { usePullRequest, useSyncPullRequest } from "@/lib/api/hooks/pull-requests";
import { useRepository } from "@/lib/api/hooks/repositories";
import { formatDateTime, shortSha } from "@/lib/utils";

export default function PullRequestPage({ params }: { params: Promise<{ prId: string }> }) {
  const { prId } = use(params);
  const { orgId, isAdmin } = useOrgContext();
  const pr = usePullRequest(orgId, prId);
  const sync = useSyncPullRequest(orgId);
  const p = pr.data;
  const repo = useRepository(orgId, p?.repository_id ?? "");

  if (pr.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 rounded-[18px]" />
      </div>
    );
  }
  if (pr.isError || !p) return <ErrorState message={messageOf(pr.error)} onRetry={() => pr.refetch()} />;

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}/pull-requests`, label: "Pull requests" }}
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <StatusBadge status={p.state} />
            {p.is_draft ? <Badge>Draft</Badge> : null}
            <MockBadge show={p.is_mock} />
          </span>
        }
        title={p.title}
        description={
          <span className="t-mono text-[13px]">
            {p.branch} → {p.base_branch}
          </span>
        }
        actions={
          <>
            {p.html_url ? (
              <a href={p.html_url} target="_blank" rel="noreferrer">
                <Button trailing={<ExternalLink className="size-4" />}>View on GitHub</Button>
              </a>
            ) : null}
            {isAdmin && p.state !== "failed" && p.state !== "pending" ? (
              <Button variant="secondary" leading={<RefreshCw className="size-4" />} loading={sync.isPending} onClick={() => sync.mutate(prId, { onSuccess: (n) => toast.success(`Now ${n.state}`) })}>
                Sync state
              </Button>
            ) : null}
          </>
        }
      />

      {p.error ? (
        <div role="alert" className="mb-5 rounded-[14px] bg-danger-soft px-4 py-3">
          <p className="t-body font-medium text-danger">Delivery failed</p>
          <p className="t-footnote mt-0.5 text-text">{p.error}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Section title="Pull request body" description="Exactly what reviewers see on GitHub. Provider and agent text is fenced and shown for review, never executed.">
            <Card className="p-5">
              <pre className="t-body whitespace-pre-wrap break-words font-sans text-text">{p.body}</pre>
            </Card>
          </Section>
          {p.files?.length ? (
            <Section title="Files changed">
              <ul className="card divide-y divide-separator overflow-hidden">
                {p.files.map((f, i) => (
                  <li key={i} className="t-mono px-4 py-2.5 text-text">
                    {typeof f === "string" ? f : JSON.stringify(f)}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          <Section title="Verification summary">
            <Code block className="text-[12px]">{JSON.stringify(p.verification, null, 2)}</Code>
          </Section>
        </div>
        <div>
          <ListGroup>
            <dl className="divide-y divide-separator">
              <KeyValue
                label="Repository"
                value={
                  <Link href={`/o/${orgId}/repositories/${p.repository_id}`} className="text-accent hover:underline">
                    {repo.data?.full_name ?? "Open"}
                  </Link>
                }
              />
              <KeyValue label="Number" value={p.number ? `#${p.number}` : "—"} />
              <KeyValue label="Base" value={shortSha(p.base_sha)} mono />
              <KeyValue label="Head" value={shortSha(p.head_sha)} mono />
              <KeyValue
                label="Repair"
                value={
                  <Link href={`/o/${orgId}/repairs/${p.repair_job_id}`} className="text-accent hover:underline">
                    Open
                  </Link>
                }
              />
              <KeyValue
                label="Finding"
                value={
                  <Link href={`/o/${orgId}/findings/${p.finding_id}`} className="text-accent hover:underline">
                    Open
                  </Link>
                }
              />
              <KeyValue label="Opened" value={formatDateTime(p.opened_at)} />
              <KeyValue label="Merged" value={formatDateTime(p.merged_at)} />
              <KeyValue label="Closed" value={formatDateTime(p.closed_at)} />
              <KeyValue label="Last synced" value={formatDateTime(p.last_synced_at)} />
            </dl>
          </ListGroup>
        </div>
      </div>
    </>
  );
}
