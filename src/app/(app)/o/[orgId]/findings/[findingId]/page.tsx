"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, EyeOff, RotateCcw, Wrench } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, KeyValue, ListGroup } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { PageHeader, Section } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { EvidenceList, UnknownsList } from "@/components/shared/evidence";
import { Operation } from "@/components/shared/operation";
import { ApiError, messageOf } from "@/lib/api/client";
import { useChange } from "@/lib/api/hooks/changes";
import { useFinding, useFindingAction, useRequestRepair } from "@/lib/api/hooks/findings";
import { useRepairs } from "@/lib/api/hooks/repairs";
import { useRepository } from "@/lib/api/hooks/repositories";
import { useSource } from "@/lib/api/hooks/sources";
import { formatDateTime, humanize } from "@/lib/utils";

export default function FindingPage({ params }: { params: Promise<{ findingId: string }> }) {
  const { findingId } = use(params);
  const { orgId, isAdmin } = useOrgContext();
  const router = useRouter();
  const finding = useFinding(orgId, findingId);
  const act = useFindingAction(orgId);
  const requestRepair = useRequestRepair(orgId);
  const [confirmRepair, setConfirmRepair] = useState(false);
  const f = finding.data;

  if (finding.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-28 rounded-[18px]" />
        <Skeleton className="h-48 rounded-[18px]" />
      </div>
    );
  }
  if (finding.isError || !f) return <ErrorState message={messageOf(finding.error)} onRetry={() => finding.refetch()} />;

  const canRepair = isAdmin && !!f.repository_id && f.kind === "api_change" && !["resolved", "dismissed"].includes(f.status);
  const busy = act.isPending;

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}/findings`, label: "Findings" }}
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <SeverityBadge severity={f.severity} /> <StatusBadge status={f.status} />
          </span>
        }
        title={f.title}
        description={f.summary}
        actions={
          <>
            {f.status === "dismissed" ? (
              <Button variant="secondary" leading={<RotateCcw className="size-4" />} loading={busy} onClick={() => act.mutate({ findingId, action: "reopen" })}>
                Reopen
              </Button>
            ) : (
              <>
                {!f.acknowledged_at ? (
                  <Button variant="secondary" leading={<Check className="size-4" />} loading={busy} onClick={() => act.mutate({ findingId, action: "acknowledge" }, { onSuccess: () => toast.success("Acknowledged") })}>
                    Acknowledge
                  </Button>
                ) : null}
                <Button variant="secondary" leading={<EyeOff className="size-4" />} loading={busy} onClick={() => act.mutate({ findingId, action: "dismiss" }, { onSuccess: () => toast.success("Dismissed", "The record is kept for audit.") })}>
                  Dismiss
                </Button>
              </>
            )}
            {canRepair ? (
              <Button leading={<Wrench className="size-4" />} onClick={() => setConfirmRepair(true)}>
                Request repair
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {f.explanation ? (
            <Card className="p-5">
              <h2 className="t-headline mb-1.5 text-text">Why this matters</h2>
              <p className="t-body whitespace-pre-wrap text-text">{f.explanation}</p>
            </Card>
          ) : null}
          {f.suggested_action ? (
            <Card className="border-accent-soft bg-[color-mix(in_srgb,var(--accent-soft)_50%,var(--surface))] p-5">
              <h2 className="t-headline mb-1.5 text-text">Suggested action</h2>
              <p className="t-body whitespace-pre-wrap text-text">{f.suggested_action}</p>
            </Card>
          ) : null}

          <Section title="Code evidence" description="Where the affected API is used, as found by the last scan.">
            <Card className="overflow-hidden">
              <EvidenceList items={f.evidence} />
            </Card>
          </Section>

          {f.unknowns?.length ? (
            <Section title="What static analysis couldn't tell" description="Dynamic calls, SDK version mapping and similar limits are listed rather than guessed.">
              <Card className="overflow-hidden">
                <UnknownsList items={f.unknowns} />
              </Card>
            </Section>
          ) : null}

          <RelatedRepairs orgId={orgId} findingId={findingId} />
        </div>

        <div className="min-w-0 space-y-6">
          {f.api_change_id ? <ChangeCard orgId={orgId} changeId={f.api_change_id} /> : null}
          <ListGroup>
            <dl className="divide-y divide-separator">
              <KeyValue label="Kind" value={humanize(f.kind)} />
              <KeyValue label="Confidence" value={<Badge>{humanize(f.confidence)}</Badge>} />
              {f.repository_id ? <KeyValue label="Repository" value={<RepoLink orgId={orgId} repoId={f.repository_id} />} /> : null}
              {f.api_source_id ? <KeyValue label="API source" value={<SourceLink orgId={orgId} sourceId={f.api_source_id} />} /> : null}
              {f.integration_id ? <KeyValue label="Integration" value={<Link href={`/o/${orgId}/integrations?open=${f.integration_id}`} className="text-accent hover:underline">View</Link>} /> : null}
              <KeyValue label="Detected" value={formatDateTime(f.created_at)} />
              {f.acknowledged_at ? <KeyValue label="Acknowledged" value={formatDateTime(f.acknowledged_at)} /> : null}
              {f.dismissed_at ? <KeyValue label="Dismissed" value={formatDateTime(f.dismissed_at)} /> : null}
              {f.resolved_at ? <KeyValue label="Resolved" value={formatDateTime(f.resolved_at)} /> : null}
            </dl>
          </ListGroup>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRepair}
        onClose={() => setConfirmRepair(false)}
        title="Request an AI repair?"
        description="The agent sees only the files in this finding's evidence. Its patch is verified in a sandbox before anything can be delivered, and nothing is ever merged automatically."
        confirmLabel="Request repair"
        loading={requestRepair.isPending}
        onConfirm={() =>
          requestRepair.mutate(findingId, {
            onSuccess: (job) => {
              setConfirmRepair(false);
              toast.success("Repair queued");
              router.push(`/o/${orgId}/repairs/${job.id}`);
            },
            onError: (e) => {
              setConfirmRepair(false);
              if (e instanceof ApiError && e.status === 503) toast.error("AI repair is not configured", e.message);
              else if (e instanceof ApiError && e.isPlanLimit) toast.error("Plan limit reached", e.message);
            },
          })
        }
      />
    </>
  );
}

function ChangeCard({ orgId, changeId }: { orgId: string; changeId: string }) {
  const change = useChange(orgId, changeId);
  const c = change.data;
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="t-headline text-text">API change</h2>
        <Link href={`/o/${orgId}/changes/${changeId}`} className="pressable inline-flex items-center gap-0.5 text-[13px] font-medium text-accent hover:underline">
          Details <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {change.isPending ? (
        <Skeleton className="h-12" />
      ) : c ? (
        <>
          <p className="t-body text-text">{c.summary}</p>
          <Operation method={c.operation_method} path={c.operation_path} className="mt-2 max-w-full" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge>{humanize(c.category)}</Badge>
            <Badge>{c.rule_id}</Badge>
          </div>
        </>
      ) : (
        <p className="t-footnote text-text-2">Unavailable.</p>
      )}
    </Card>
  );
}

function RelatedRepairs({ orgId, findingId }: { orgId: string; findingId: string }) {
  const repairs = useRepairs(orgId, { page_size: 50 });
  const related = repairs.data?.items.filter((r) => r.finding_id === findingId) ?? [];
  if (!related.length) return null;
  return (
    <Section title="Repairs">
      <ListGroup>
        {related.map((r) => (
          <Link key={r.id} href={`/o/${orgId}/repairs/${r.id}`} className="pressable-row flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-text">Repair {r.id.slice(0, 8)}</span>
              <span className="t-caption text-text-2">
                Attempt {r.attempt_count}/{r.max_attempts} · {formatDateTime(r.created_at)}
              </span>
            </span>
            <StatusBadge status={r.status} />
          </Link>
        ))}
      </ListGroup>
    </Section>
  );
}

function RepoLink({ orgId, repoId }: { orgId: string; repoId: string }) {
  const repo = useRepository(orgId, repoId);
  return (
    <Link href={`/o/${orgId}/repositories/${repoId}`} className="text-accent hover:underline">
      {repo.data?.full_name ?? "View"}
    </Link>
  );
}

function SourceLink({ orgId, sourceId }: { orgId: string; sourceId: string }) {
  const source = useSource(orgId, sourceId);
  return (
    <Link href={`/o/${orgId}/sources/${sourceId}`} className="text-accent hover:underline">
      {source.data?.name ?? "View"}
    </Link>
  );
}
