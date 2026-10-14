"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, GitBranch, MoreHorizontal, Pause, Play, RadarIcon, Unplug } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyValue, ListGroup } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Menu } from "@/components/ui/menu";
import { Code, PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { ListShell } from "@/components/shared/list-shell";
import { IntegrationRow, IntegrationSheet } from "@/components/integrations/integration-row";
import { messageOf } from "@/lib/api/client";
import { useFindings } from "@/lib/api/hooks/findings";
import { useIntegrations } from "@/lib/api/hooks/integrations";
import { useDisconnectRepository, useRepository, useScanNow, useScans, useUpdateRepository } from "@/lib/api/hooks/repositories";
import type { Scan } from "@/lib/api/types";
import { formatDateTime, formatDuration, humanize, shortSha, timeAgo } from "@/lib/utils";

type Tab = "integrations" | "findings" | "scans";

export default function RepositoryPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = use(params);
  const { orgId, isAdmin } = useOrgContext();
  const router = useRouter();
  const repo = useRepository(orgId, repoId);
  const scanNow = useScanNow(orgId, repoId);
  const update = useUpdateRepository(orgId, repoId);
  const disconnect = useDisconnectRepository(orgId);
  const [tab, setTab] = useState<Tab>("integrations");
  const [branchSheet, setBranchSheet] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [openIntegration, setOpenIntegration] = useState<string | null>(null);
  const r = repo.data;

  if (repo.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 rounded-[18px]" />
      </div>
    );
  }
  if (repo.isError || !r) return <ErrorState message={messageOf(repo.error)} onRetry={() => repo.refetch()} />;

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}/repositories`, label: "Repositories" }}
        eyebrow={
          <span className="inline-flex items-center gap-2">
            {r.is_active ? <StatusBadge status={r.connection_status} /> : <Badge>Paused</Badge>}
            <Badge>
              <GitBranch className="mr-1 size-3" /> {r.selected_branch}
            </Badge>
          </span>
        }
        title={r.full_name}
        description={r.last_scan_at ? `Last scanned ${timeAgo(r.last_scan_at)} at ${shortSha(r.last_scanned_sha)}` : "Waiting for the first scan."}
        actions={
          <>
            {r.html_url ? (
              <a href={r.html_url} target="_blank" rel="noreferrer">
                <Button variant="secondary" trailing={<ExternalLink className="size-3.5" />}>
                  GitHub
                </Button>
              </a>
            ) : null}
            {isAdmin ? (
              <>
                <Button leading={<RadarIcon className="size-4" />} loading={scanNow.isPending} onClick={() => scanNow.mutate(undefined, { onSuccess: () => { toast.success("Scan queued"); setTab("scans"); } })}>
                  Scan now
                </Button>
                <Menu
                  items={[
                    { label: "Change branch", icon: <GitBranch />, onSelect: () => setBranchSheet(true) },
                    { label: r.is_active ? "Pause monitoring" : "Resume monitoring", icon: r.is_active ? <Pause /> : <Play />, onSelect: () => update.mutate({ is_active: !r.is_active }, { onSuccess: (n) => toast.success(n.is_active ? "Monitoring resumed" : "Monitoring paused") }) },
                    { label: "Disconnect", icon: <Unplug />, onSelect: () => setConfirmDisconnect(true), danger: true },
                  ]}
                  trigger={
                    <Button variant="secondary" size="icon" aria-label="More actions">
                      <MoreHorizontal className="size-5" />
                    </Button>
                  }
                />
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Segmented ariaLabel="Section" value={tab} onChange={setTab} className="mb-3" options={[{ value: "integrations", label: "Integrations" }, { value: "findings", label: "Findings" }, { value: "scans", label: "Scans" }]} />
          {tab === "integrations" ? <Integrations orgId={orgId} repoId={repoId} onOpen={setOpenIntegration} /> : tab === "findings" ? <Findings orgId={orgId} repoId={repoId} /> : <Scans orgId={orgId} repoId={repoId} />}
        </div>
        <div>
          <ListGroup>
            <dl className="divide-y divide-separator">
              <KeyValue label="Default branch" value={r.default_branch} />
              <KeyValue label="Watching" value={r.selected_branch} />
              <KeyValue label="Visibility" value={r.is_private ? "Private" : "Public"} />
              <KeyValue label="Last scanned commit" value={shortSha(r.last_scanned_sha)} mono />
              <KeyValue label="Connected" value={formatDateTime(r.created_at)} />
              <KeyValue label="GitHub id" value={r.github_repo_id} mono />
            </dl>
          </ListGroup>
        </div>
      </div>

      <BranchSheet open={branchSheet} onClose={() => setBranchSheet(false)} current={r.selected_branch} onSave={(b) => update.mutate({ selected_branch: b }, { onSuccess: () => { toast.success("Branch updated", "The next scan uses it."); setBranchSheet(false); } })} saving={update.isPending} />
      <IntegrationSheet orgId={orgId} integrationId={openIntegration} onClose={() => setOpenIntegration(null)} />
      <ConfirmDialog
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title={`Disconnect ${r.full_name}?`}
        description="Scans stop and the integration inventory for this repository is removed. Nothing changes on GitHub."
        confirmLabel="Disconnect"
        variant="danger"
        loading={disconnect.isPending}
        onConfirm={() => disconnect.mutate(repoId, { onSuccess: () => { toast.success("Repository disconnected"); router.replace(`/o/${orgId}/repositories`); } })}
      />
    </>
  );
}

function Integrations({ orgId, repoId, onOpen }: { orgId: string; repoId: string; onOpen: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const query = useIntegrations(orgId, { repository_id: repoId, page, page_size: 20 });
  return (
    <ListShell query={query} onPage={setPage} empty={<EmptyState compact title="No integrations detected yet" description="Once a scan finishes, every third-party SDK or API found in manifests and source files is listed here with its evidence." />}>
      {(items) => (
        <ListGroup>
          {items.map((i) => (
            <IntegrationRow key={i.id} integration={i} onClick={() => onOpen(i.id)} />
          ))}
        </ListGroup>
      )}
    </ListShell>
  );
}

function Findings({ orgId, repoId }: { orgId: string; repoId: string }) {
  const [page, setPage] = useState(1);
  const query = useFindings(orgId, { repository_id: repoId, page, page_size: 20 });
  return (
    <ListShell query={query} onPage={setPage} empty={<EmptyState compact title="No findings for this repository" description="Findings appear when a monitored API change maps to code in this repository." />}>
      {(items) => (
        <ListGroup>
          {items.map((f) => (
            <Link key={f.id} href={`/o/${orgId}/findings/${f.id}`} className="pressable-row flex items-start gap-3 px-4 py-3 hover:bg-surface-2">
              <SeverityBadge severity={f.severity} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-text">{f.title}</span>
                <span className="t-footnote line-clamp-1 text-text-2">{f.summary}</span>
              </span>
              <StatusBadge status={f.status} />
            </Link>
          ))}
        </ListGroup>
      )}
    </ListShell>
  );
}

function Scans({ orgId, repoId }: { orgId: string; repoId: string }) {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Scan | null>(null);
  const query = useScans(orgId, repoId, { page, page_size: 20 });
  return (
    <>
      <ListShell query={query} onPage={setPage} empty={<EmptyState compact title="No scans yet" />}>
        {(items) => (
          <ListGroup>
            {items.map((s) => {
              const dur = s.started_at && s.finished_at ? new Date(s.finished_at).getTime() - new Date(s.started_at).getTime() : null;
              return (
                <button key={s.id} type="button" onClick={() => setOpen(s)} className="pressable-row flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-text">
                      {humanize(s.trigger)} scan · {s.branch} {s.commit_sha ? `@ ${shortSha(s.commit_sha)}` : ""}
                    </span>
                    <span className="t-caption block text-text-2">
                      {formatDateTime(s.created_at)} · {s.integrations_found} integrations · {formatDuration(dur)}
                      {s.limitations?.length ? ` · ${s.limitations.length} limitation${s.limitations.length === 1 ? "" : "s"}` : ""}
                    </span>
                    {s.error ? <span className="t-footnote block truncate text-danger">{s.error}</span> : null}
                  </span>
                  <StatusBadge status={s.status} />
                </button>
              );
            })}
          </ListGroup>
        )}
      </ListShell>
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Scan details" description={open ? `${formatDateTime(open.created_at)} · ${open.branch}` : undefined} size="lg">
        {open ? (
          <div className="space-y-5 pb-2">
            <ListGroup>
              <dl className="divide-y divide-separator">
                <KeyValue label="Status" value={<StatusBadge status={open.status} />} />
                <KeyValue label="Trigger" value={humanize(open.trigger)} />
                <KeyValue label="Commit" value={shortSha(open.commit_sha)} mono />
                <KeyValue label="Integrations found" value={open.integrations_found} />
                <KeyValue label="Started" value={formatDateTime(open.started_at)} />
                <KeyValue label="Finished" value={formatDateTime(open.finished_at)} />
              </dl>
            </ListGroup>
            {open.error ? <div className="rounded-[14px] bg-danger-soft p-4 text-[14px] text-danger">{open.error}</div> : null}
            {open.limitations?.length ? (
              <div>
                <h3 className="t-headline mb-2 text-text">Limitations of this scan</h3>
                <ul className="list-disc space-y-1 pl-5 text-[14px] text-text">
                  {open.limitations.map((l, i) => (
                    <li key={i}>{typeof l === "string" ? l : JSON.stringify(l)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <h3 className="t-headline mb-2 text-text">Stats</h3>
              <Code block>{JSON.stringify(open.stats, null, 2)}</Code>
            </div>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

function BranchSheet({ open, onClose, current, onSave, saving }: { open: boolean; onClose: () => void; current: string; onSave: (b: string) => void; saving: boolean }) {
  const [branch, setBranch] = useState(current);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (branch.trim() && branch.trim() !== current) onSave(branch.trim());
  };
  return (
    <Sheet open={open} onClose={onClose} title="Change watched branch" description="Pushes to this branch trigger a re-scan. Repairs are proposed against it.">
      <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
        <Input label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} autoFocus required />
        <Button type="submit" size="lg" loading={saving} disabled={!branch.trim() || branch.trim() === current}>
          Save
        </Button>
      </form>
    </Sheet>
  );
}
