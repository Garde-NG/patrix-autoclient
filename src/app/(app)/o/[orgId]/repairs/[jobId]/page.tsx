"use client";

import { use, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, CircleDashed, ExternalLink, GitPullRequest, RotateCcw, Send, XCircle } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, KeyValue, ListGroup } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Code, PageHeader, Section } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { DiffView } from "@/components/shared/diff-view";
import { messageOf } from "@/lib/api/client";
import { useFinding } from "@/lib/api/hooks/findings";
import { LIVE_REPAIR, useRepair, useRepairAction } from "@/lib/api/hooks/repairs";
import { useRepository } from "@/lib/api/hooks/repositories";
import type { RepairAttemptDetail, RepairStatus, VerificationCheck, VerificationRun } from "@/lib/api/types";
import { cn, formatDateTime, formatDuration, humanize, shortSha } from "@/lib/utils";

const STAGES: Array<{ key: string; label: string; reached: (s: RepairStatus) => boolean; active: (s: RepairStatus) => boolean }> = [
  { key: "generate", label: "Generate", reached: (s) => s !== "queued", active: (s) => s === "generating" },
  { key: "verify", label: "Verify", reached: (s) => ["verified", "verification_failed", "delivering", "delivered"].includes(s), active: (s) => s === "verifying" || s === "generated" },
  { key: "deliver", label: "Deliver", reached: (s) => s === "delivered", active: (s) => s === "delivering" },
];

export default function RepairPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const { orgId, isAdmin } = useOrgContext();
  const job = useRepair(orgId, jobId);
  const act = useRepairAction(orgId);
  const j = job.data;
  const repo = useRepository(orgId, j?.repository_id ?? "");
  const finding = useFinding(orgId, j?.finding_id ?? "");
  const [confirm, setConfirm] = useState<"deliver" | "cancel" | null>(null);

  if (job.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20 rounded-[18px]" />
        <Skeleton className="h-64 rounded-[18px]" />
      </div>
    );
  }
  if (job.isError || !j) return <ErrorState message={messageOf(job.error)} onRetry={() => job.refetch()} />;

  const live = LIVE_REPAIR.has(j.status);
  const failed = j.status === "failed" || j.status === "verification_failed" || j.status === "cancelled";

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}/repairs`, label: "Repairs" }}
        eyebrow={<StatusBadge status={j.status} />}
        title={repo.data ? `Repair for ${repo.data.full_name}` : "Repair"}
        description={finding.data ? finding.data.title : undefined}
        actions={
          isAdmin ? (
            <>
              {j.status === "verified" ? (
                <Button leading={<Send className="size-4" />} onClick={() => setConfirm("deliver")}>
                  Open pull request
                </Button>
              ) : null}
              {(j.status === "failed" || j.status === "verification_failed") ? (
                <Button variant="secondary" leading={<RotateCcw className="size-4" />} loading={act.isPending} onClick={() => act.mutate({ jobId, action: "retry" }, { onSuccess: () => toast.success("Retry queued") })}>
                  Retry
                </Button>
              ) : null}
              {live ? (
                <Button variant="danger-tinted" onClick={() => setConfirm("cancel")}>
                  Cancel
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <Card className="mb-6 p-5">
        <ol className="flex items-center gap-2 sm:gap-4">
          {STAGES.map((stage, i) => {
            const reached = stage.reached(j.status);
            const active = stage.active(j.status);
            return (
              <li key={stage.key} className="flex flex-1 items-center gap-2 sm:gap-3">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", reached ? "bg-success text-white" : active ? "bg-accent text-white" : failed && !reached ? "bg-fill text-text-3" : "bg-fill text-text-3")}>
                  {reached ? <CheckCircle2 className="size-4" /> : active ? <CircleDashed className="size-4 animate-spin [animation-duration:2.5s]" /> : <Circle className="size-4" />}
                </span>
                <span className={cn("text-[13px] font-medium sm:text-[14px]", reached || active ? "text-text" : "text-text-3")}>{stage.label}</span>
                {i < STAGES.length - 1 ? <span className={cn("ml-1 h-px flex-1", reached ? "bg-success" : "bg-separator")} aria-hidden /> : null}
              </li>
            );
          })}
        </ol>
        {j.error ? <p className="t-footnote mt-4 rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">{j.error}</p> : null}
        {j.status === "delivered" && j.pull_request ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-success-soft px-4 py-3">
            <span className="flex items-center gap-2 text-[14px] text-text">
              <GitPullRequest className="size-4 text-success" /> Pull request {j.pull_request.number ? `#${j.pull_request.number}` : ""} is {j.pull_request.state}.
            </span>
            <span className="flex gap-2">
              <Link href={`/o/${orgId}/pull-requests/${j.pull_request.id}`}>
                <Button variant="secondary" size="sm">
                  Details
                </Button>
              </Link>
              {j.pull_request.html_url ? (
                <a href={j.pull_request.html_url} target="_blank" rel="noreferrer">
                  <Button variant="tinted" size="sm" trailing={<ExternalLink className="size-3.5" />}>
                    GitHub
                  </Button>
                </a>
              ) : null}
            </span>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {j.attempts.length ? (
            [...j.attempts].sort((a, b) => b.number - a.number).map((a) => <Attempt key={a.id} attempt={a} isCurrent={a.id === j.current_attempt_id} />)
          ) : (
            <Card className="p-6 text-center">
              <p className="t-body text-text-2">{live ? "The agent is working. This page updates automatically." : "No attempts were recorded."}</p>
            </Card>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          <ListGroup>
            <dl className="divide-y divide-separator">
              <KeyValue label="Attempts" value={`${j.attempt_count} / ${j.max_attempts}`} />
              <KeyValue
                label="Finding"
                value={
                  <Link href={`/o/${orgId}/findings/${j.finding_id}`} className="text-accent hover:underline">
                    Open
                  </Link>
                }
              />
              <KeyValue
                label="Repository"
                value={
                  <Link href={`/o/${orgId}/repositories/${j.repository_id}`} className="text-accent hover:underline">
                    {repo.data?.full_name ?? "Open"}
                  </Link>
                }
              />
              {j.api_change_id ? (
                <KeyValue
                  label="API change"
                  value={
                    <Link href={`/o/${orgId}/changes/${j.api_change_id}`} className="text-accent hover:underline">
                      Open
                    </Link>
                  }
                />
              ) : null}
              <KeyValue label="Requested" value={formatDateTime(j.created_at)} />
              <KeyValue label="Finished" value={formatDateTime(j.finished_at)} />
            </dl>
          </ListGroup>
          <Section title="Write policy" description="What the agent was allowed to touch.">
            <Code block className="text-[12px]">{JSON.stringify(j.policy, null, 2)}</Code>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "deliver"}
        onClose={() => setConfirm(null)}
        title="Open a pull request?"
        description="The verified patch is re-applied to the current head of the watched branch and pushed to a new autoapi/ branch. The PR is for your team to review; AutoAPI never merges."
        confirmLabel="Open pull request"
        loading={act.isPending}
        onConfirm={() => act.mutate({ jobId, action: "deliver" }, { onSuccess: () => { setConfirm(null); toast.success("Delivery started"); }, onError: () => setConfirm(null) })}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        onClose={() => setConfirm(null)}
        title="Cancel this repair?"
        description="Work in progress stops. You can request a new repair from the finding later."
        confirmLabel="Cancel repair"
        variant="danger"
        loading={act.isPending}
        onConfirm={() => act.mutate({ jobId, action: "cancel" }, { onSuccess: () => { setConfirm(null); toast.success("Repair cancelled"); }, onError: () => setConfirm(null) })}
      />
    </>
  );
}

function Attempt({ attempt: a, isCurrent }: { attempt: RepairAttemptDetail; isCurrent: boolean }) {
  const [showPatch, setShowPatch] = useState(isCurrent);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <div className="flex items-center gap-2">
          <h2 className="t-headline text-text">Attempt {a.number}</h2>
          {isCurrent ? <Badge tone="accent">Current</Badge> : null}
          <StatusBadge status={a.status} />
        </div>
        <p className="t-caption text-text-2">
          {a.agent_name ?? "agent"}
          {a.model ? ` · ${a.model}` : ""} · {formatDateTime(a.started_at)}
          {a.base_commit_sha ? ` · base ${shortSha(a.base_commit_sha)}` : ""}
        </p>
      </div>
      <div className="space-y-4 px-5 py-4">
        {a.error ? <p className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">{a.error}</p> : null}
        {a.explanation ? (
          <div>
            <h3 className="t-footnote mb-1 font-semibold uppercase tracking-wide text-text-2">Explanation</h3>
            <p className="t-body whitespace-pre-wrap text-text">{a.explanation}</p>
          </div>
        ) : null}
        {a.uncertainties?.length ? (
          <div>
            <h3 className="t-footnote mb-1 font-semibold uppercase tracking-wide text-text-2">Open questions from the agent</h3>
            <ul className="list-disc space-y-1 pl-5 text-[14px] text-text">
              {a.uncertainties.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {a.affected_files?.length ? (
          <div>
            <h3 className="t-footnote mb-1 font-semibold uppercase tracking-wide text-text-2">Files changed</h3>
            <ul className="flex flex-wrap gap-1.5">
              {a.affected_files.map((f) => (
                <li key={f} className="t-mono rounded-[6px] bg-fill px-2 py-0.5 text-[12px] text-text">
                  {f}
                </li>
              ))}
              {a.tests_added?.map((f) => (
                <li key={`t-${f}`} className="t-mono rounded-[6px] bg-success-soft px-2 py-0.5 text-[12px] text-text">
                  + {f}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {a.verification_runs.map((run) => (
          <Verification key={run.id} run={run} />
        ))}
        {a.patch ? (
          <div>
            <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={() => setShowPatch((v) => !v)}>
              {showPatch ? "Hide patch" : "Show patch"}
            </Button>
            {showPatch ? <DiffView patch={a.patch} /> : null}
          </div>
        ) : null}
        {Object.keys(a.token_usage ?? {}).length ? (
          <p className="t-caption text-text-3">
            Tokens:{" "}
            {Object.entries(a.token_usage)
              .map(([k, v]) => `${humanize(k)} ${v}`)
              .join(" · ")}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function Verification({ run }: { run: VerificationRun }) {
  const isolated = run.isolation === "docker" || run.isolation === "container";
  return (
    <div className="rounded-[14px] border border-separator">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="t-footnote font-semibold uppercase tracking-wide text-text-2">Verification</h3>
          <StatusBadge status={run.status} />
          <Badge tone={isolated ? "success" : "warning"}>
            {humanize(run.runner)} · {humanize(run.isolation)}
          </Badge>
          <Badge>{humanize(run.verification_level)}</Badge>
        </div>
        <span className="t-caption text-text-3">{formatDateTime(run.started_at)}</span>
      </div>
      {!isolated && run.runner !== "none" ? <p className="t-footnote border-t border-separator bg-warning-soft px-4 py-2 text-text">Checks did not run in an isolated container. Treat results with care.</p> : null}
      {run.error ? <p className="t-footnote border-t border-separator px-4 py-2 text-danger">{run.error}</p> : null}
      {run.checks?.length ? (
        <ul className="divide-y divide-separator border-t border-separator">
          {run.checks.map((c, i) => (
            <Check key={i} check={c} />
          ))}
        </ul>
      ) : (
        <p className="t-footnote border-t border-separator px-4 py-3 text-text-2">No checks were configured.</p>
      )}
    </div>
  );
}

function Check({ check: c }: { check: VerificationCheck }) {
  const [open, setOpen] = useState(false);
  const status = (c.status as string) ?? "unknown";
  const icon = status === "passed" ? <CheckCircle2 className="size-4 text-success" /> : status === "failed" || status === "error" ? <XCircle className="size-4 text-danger" /> : <Circle className="size-4 text-text-3" />;
  return (
    <li>
      <button type="button" onClick={() => setOpen((v) => !v)} className="pressable-row flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2">
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-text">{humanize((c.name as string) ?? "check")}</span>
          {c.command ? <span className="t-mono block truncate text-[12px] text-text-2">{c.command}</span> : null}
        </span>
        <span className="t-caption shrink-0 tabular-nums text-text-3">
          {c.exit_code !== undefined && c.exit_code !== null ? `exit ${c.exit_code} · ` : ""}
          {formatDuration(c.duration_ms ?? null)}
        </span>
      </button>
      {open && c.output ? <Code block className="mx-4 mb-3 max-h-72 text-[11.5px]">{c.output}</Code> : null}
    </li>
  );
}
