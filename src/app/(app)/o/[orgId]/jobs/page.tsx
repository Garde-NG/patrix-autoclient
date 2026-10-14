"use client";

import { useMemo, useState } from "react";
import { Activity, RotateCcw, XCircle } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyValue, ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Code, PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { FilterBar, ListShell, Toolbar } from "@/components/shared/list-shell";
import { useJob, useJobAction, useJobs } from "@/lib/api/hooks/jobs";
import { useListParams } from "@/lib/hooks/use-list-params";
import type { JobStatus } from "@/lib/api/types";
import { formatDateTime, formatDuration, timeAgo } from "@/lib/utils";

type StatusFilter = "" | JobStatus;
const DEFAULTS = { status: "" as StatusFilter, kind: "" };

export default function JobsPage() {
  const { orgId, isAdmin } = useOrgContext();
  const { params, update, setPage } = useListParams(DEFAULTS);
  const filters = useMemo(() => ({ page: params.page, page_size: 25, status: params.status || undefined, kind: params.kind || undefined }), [params]);
  const query = useJobs(orgId, filters);
  const [open, setOpen] = useState<string | null>(null);
  const job = useJob(orgId, open);
  const act = useJobAction(orgId);

  return (
    <>
      <PageHeader title="Jobs" description="Background work for this workspace: fetches, diffs, scans, repairs and deliveries." />
      <Toolbar>
        <FilterBar className="mb-0 flex-nowrap">
          <Segmented
            ariaLabel="Status"
            value={params.status}
            onChange={(status) => update({ status })}
            options={[
              { value: "", label: "All" },
              { value: "queued", label: "Queued" },
              { value: "running", label: "Running" },
              { value: "succeeded", label: "Succeeded" },
              { value: "dead", label: "Dead" },
            ]}
          />
          <Input value={params.kind} onChange={(e) => update({ kind: e.target.value })} placeholder="Kind, e.g. repo.scan" wrapperClassName="w-48 shrink-0" className="h-9 text-[13px] font-mono" aria-label="Kind" />
        </FilterBar>
      </Toolbar>
      <ListShell query={query} onPage={setPage} empty={<EmptyState icon={Activity} title="No jobs" description="Jobs appear when sources are fetched, repositories scanned or repairs requested." />}>
        {(items) => (
          <ListGroup>
            {items.map((j) => (
              <button key={j.id} type="button" onClick={() => setOpen(j.id)} className="pressable-row flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="t-mono text-[13px] font-semibold text-text">{j.kind}</span>
                    {j.attempts > 1 ? <Badge tone="warning">{j.attempts} attempts</Badge> : null}
                  </span>
                  <span className="t-caption block text-text-2">
                    {j.status === "queued" ? `Runs ${timeAgo(j.run_at)}` : `Created ${timeAgo(j.created_at)}`}
                    {j.started_at && j.finished_at ? ` · took ${formatDuration(new Date(j.finished_at).getTime() - new Date(j.started_at).getTime())}` : ""}
                  </span>
                  {j.last_error ? <span className="t-footnote block truncate text-danger">{j.last_error}</span> : null}
                </span>
                <StatusBadge status={j.status} />
              </button>
            ))}
          </ListGroup>
        )}
      </ListShell>

      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        size="lg"
        title={job.data?.kind ?? "Job"}
        description={job.data ? `${formatDateTime(job.data.created_at)}` : undefined}
        footer={
          isAdmin && job.data && (job.data.status === "dead" || job.data.status === "queued") ? (
            job.data.status === "dead" ? (
              <Button className="w-full" leading={<RotateCcw className="size-4" />} loading={act.isPending} onClick={() => act.mutate({ jobId: job.data!.id, action: "retry" }, { onSuccess: () => { toast.success("Job re-queued"); setOpen(null); } })}>
                Retry job
              </Button>
            ) : (
              <Button variant="danger-tinted" className="w-full" leading={<XCircle className="size-4" />} loading={act.isPending} onClick={() => act.mutate({ jobId: job.data!.id, action: "cancel" }, { onSuccess: () => { toast.success("Job cancelled"); setOpen(null); } })}>
                Cancel job
              </Button>
            )
          ) : undefined
        }
      >
        {job.data ? (
          <div className="space-y-5 pb-2">
            <ListGroup>
              <dl className="divide-y divide-separator">
                <KeyValue label="Status" value={<StatusBadge status={job.data.status} />} />
                <KeyValue label="Attempts" value={`${job.data.attempts} / ${job.data.max_attempts}`} />
                <KeyValue label="Scheduled" value={formatDateTime(job.data.run_at)} />
                <KeyValue label="Started" value={formatDateTime(job.data.started_at)} />
                <KeyValue label="Finished" value={formatDateTime(job.data.finished_at)} />
                <KeyValue label="Id" value={job.data.id} mono />
              </dl>
            </ListGroup>
            {job.data.last_error ? <div className="rounded-[14px] bg-danger-soft p-4 text-[14px] text-danger whitespace-pre-wrap">{job.data.last_error}</div> : null}
            <div>
              <h3 className="t-headline mb-2 text-text">Payload</h3>
              <Code block className="text-[12px]">{JSON.stringify(job.data.payload, null, 2)}</Code>
            </div>
            {job.data.result ? (
              <div>
                <h3 className="t-headline mb-2 text-text">Result</h3>
                <Code block className="text-[12px]">{JSON.stringify(job.data.result, null, 2)}</Code>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
