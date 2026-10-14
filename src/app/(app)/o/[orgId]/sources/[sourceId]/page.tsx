"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileJson, MoreHorizontal, Pause, Pencil, Play, RefreshCw, Trash2, Upload } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { SourceSheet } from "@/components/sources/source-form";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyValue, ListGroup } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/field";
import { Menu } from "@/components/ui/menu";
import { Code, PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { ListShell } from "@/components/shared/list-shell";
import { messageOf } from "@/lib/api/client";
import { useDeleteSource, useDiffs, useFetchSourceNow, useSnapshot, useSnapshots, useSource, useUpdateSource, useUploadSnapshot } from "@/lib/api/hooks/sources";
import { useChanges } from "@/lib/api/hooks/changes";
import { formatBytes, formatDateTime, formatDuration, humanize, timeAgo } from "@/lib/utils";
import { SeverityBadge } from "@/components/ui/badge";
import { Operation } from "@/components/shared/operation";

type Tab = "snapshots" | "diffs" | "changes";

export default function SourcePage({ params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = use(params);
  const { orgId, isAdmin } = useOrgContext();
  const router = useRouter();
  const source = useSource(orgId, sourceId);
  const update = useUpdateSource(orgId, sourceId);
  const fetchNow = useFetchSourceNow(orgId, sourceId);
  const del = useDeleteSource(orgId);
  const [tab, setTab] = useState<Tab>("snapshots");
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const s = source.data;

  if (source.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 rounded-[18px]" />
      </div>
    );
  }
  if (source.isError || !s) return <ErrorState message={messageOf(source.error)} onRetry={() => source.refetch()} />;

  const togglePause = () =>
    update.mutate({ status: s.status === "paused" ? "active" : "paused" }, { onSuccess: (n) => toast.success(n.status === "paused" ? "Polling paused" : "Polling resumed") });

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}/sources`, label: "API sources" }}
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <StatusBadge status={s.status} />
            <Badge>{s.provider_key}</Badge>
          </span>
        }
        title={s.name}
        description={s.url ? <span className="t-mono break-all text-[13px]">{s.url}</span> : "Upload-only source"}
        actions={
          isAdmin ? (
            <>
              {s.url ? (
                <Button variant="secondary" leading={<RefreshCw className="size-4" />} loading={fetchNow.isPending} onClick={() => fetchNow.mutate(undefined, { onSuccess: () => toast.success("Fetch queued") })}>
                  Fetch now
                </Button>
              ) : null}
              <Button variant="secondary" leading={<Upload className="size-4" />} onClick={() => setUploading(true)}>
                Upload document
              </Button>
              <Menu
                items={[
                  { label: "Edit", icon: <Pencil />, onSelect: () => setEditing(true) },
                  ...(s.url ? [{ label: s.status === "paused" ? "Resume polling" : "Pause polling", icon: s.status === "paused" ? <Play /> : <Pause />, onSelect: togglePause }] : []),
                  { label: "Delete source", icon: <Trash2 />, onSelect: () => setConfirmDelete(true), danger: true },
                ]}
                trigger={
                  <Button variant="secondary" size="icon" aria-label="More actions">
                    <MoreHorizontal className="size-5" />
                  </Button>
                }
              />
            </>
          ) : null
        }
      />

      {s.last_fetch_status && s.last_fetch_status !== "ok" && s.last_fetch_error ? (
        <div role="alert" className="mb-5 rounded-[14px] border border-danger/20 bg-danger-soft px-4 py-3">
          <p className="t-body font-medium text-danger">Last fetch failed ({humanize(s.last_fetch_status)})</p>
          <p className="t-footnote mt-0.5 break-words text-text">{s.last_fetch_error}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Segmented ariaLabel="Section" value={tab} onChange={setTab} className="mb-3" options={[{ value: "snapshots", label: "Snapshots" }, { value: "diffs", label: "Diff runs" }, { value: "changes", label: "Changes" }]} />
          {tab === "snapshots" ? <Snapshots orgId={orgId} sourceId={sourceId} onView={setViewing} /> : tab === "diffs" ? <Diffs orgId={orgId} sourceId={sourceId} /> : <Changes orgId={orgId} sourceId={sourceId} />}
        </div>
        <div>
          <ListGroup>
            <dl className="divide-y divide-separator">
              <KeyValue label="Kind" value={s.kind.toUpperCase()} />
              <KeyValue label="Poll interval" value={s.url ? `${Math.round(s.poll_interval_seconds / 60)} min` : "—"} />
              <KeyValue label="Last checked" value={s.last_polled_at ? `${timeAgo(s.last_polled_at)}` : "Never"} />
              <KeyValue label="Next check" value={s.status === "active" && s.next_poll_at ? timeAgo(s.next_poll_at) : "—"} />
              <KeyValue label="Last fetch" value={s.last_fetch_status ? humanize(s.last_fetch_status) : "—"} />
              <KeyValue label="Consecutive failures" value={s.consecutive_failures} />
              <KeyValue label="Credential" value={s.has_credential ? `${humanize(s.auth_type)}${s.auth_header_name ? ` (${s.auth_header_name})` : ""}` : "None"} />
              <KeyValue label="Created" value={formatDateTime(s.created_at)} />
            </dl>
          </ListGroup>
        </div>
      </div>

      <SourceSheet key={editing ? "open" : "closed"} orgId={orgId} source={s} open={editing} onClose={() => setEditing(false)} />
      <UploadSheet orgId={orgId} sourceId={sourceId} open={uploading} onClose={() => setUploading(false)} />
      <SnapshotViewer orgId={orgId} sourceId={sourceId} snapshotId={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete “${s.name}”?`}
        description="Its snapshots, diff runs and change history go with it. Findings already raised are kept."
        confirmLabel="Delete"
        variant="danger"
        loading={del.isPending}
        onConfirm={() =>
          del.mutate(sourceId, {
            onSuccess: () => {
              toast.success("Source deleted");
              router.replace(`/o/${orgId}/sources`);
            },
          })
        }
      />
    </>
  );
}

function Snapshots({ orgId, sourceId, onView }: { orgId: string; sourceId: string; onView: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const query = useSnapshots(orgId, sourceId, { page, page_size: 20 });
  return (
    <ListShell query={query} onPage={setPage} empty={<EmptyState compact icon={FileJson} title="No snapshots yet" description="The first fetch or upload captures the baseline. Changes are detected from the second snapshot on." />}>
      {(items) => (
        <ListGroup>
          {items.map((snap) => (
            <button key={snap.id} type="button" onClick={() => onView(snap.id)} className="pressable-row flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-fill text-[13px] font-semibold tabular-nums text-text-2">v{snap.version}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-text">
                  {snap.spec_format.toUpperCase()} {snap.spec_version_label ?? ""} · {formatBytes(snap.byte_size)}
                </span>
                <span className="t-caption block text-text-2">
                  {humanize(snap.origin)} · {formatDateTime(snap.fetched_at)}
                </span>
              </span>
              <span className="t-mono hidden text-text-3 sm:block">{snap.content_hash.slice(0, 10)}</span>
            </button>
          ))}
        </ListGroup>
      )}
    </ListShell>
  );
}

function Diffs({ orgId, sourceId }: { orgId: string; sourceId: string }) {
  const [page, setPage] = useState(1);
  const query = useDiffs(orgId, sourceId, { page, page_size: 20 });
  return (
    <ListShell query={query} onPage={setPage} empty={<EmptyState compact title="No diff runs" description="A diff runs automatically whenever a new snapshot differs from the previous one." />}>
      {(items) => (
        <ListGroup>
          {items.map((d) => {
            const counts = d.change_counts ?? {};
            return (
              <Link key={d.id} href={`/o/${orgId}/changes?diff_id=${d.id}`} className="pressable-row flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5 text-[14px] text-text">
                    {Object.keys(counts).length ? (
                      Object.entries(counts).map(([k, v]) => (
                        <Badge key={k} tone={k === "breaking" ? "danger" : k === "warning" ? "warning" : "neutral"}>
                          {v} {k}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-text-2">{d.status === "pending" ? "Running…" : "No changes"}</span>
                    )}
                  </span>
                  <span className="t-caption block text-text-2">
                    {d.engine} {d.engine_version ?? ""} · {formatDuration(d.duration_ms)} · {formatDateTime(d.created_at)}
                  </span>
                  {d.error ? <span className="t-footnote block truncate text-danger">{d.error}</span> : null}
                </span>
                <StatusBadge status={d.status} />
              </Link>
            );
          })}
        </ListGroup>
      )}
    </ListShell>
  );
}

function Changes({ orgId, sourceId }: { orgId: string; sourceId: string }) {
  const [page, setPage] = useState(1);
  const query = useChanges(orgId, { source_id: sourceId, page, page_size: 20 });
  return (
    <ListShell query={query} onPage={setPage} empty={<EmptyState compact title="No changes for this source" />}>
      {(items) => (
        <ListGroup>
          {items.map((c) => (
            <Link key={c.id} href={`/o/${orgId}/changes/${c.id}`} className="pressable-row flex items-start gap-3 px-4 py-3 hover:bg-surface-2">
              <SeverityBadge severity={c.severity} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] text-text">{c.summary}</span>
                <Operation method={c.operation_method} path={c.operation_path} className="mt-0.5 max-w-full text-[12px]" />
              </span>
            </Link>
          ))}
        </ListGroup>
      )}
    </ListShell>
  );
}

function UploadSheet({ orgId, sourceId, open, onClose }: { orgId: string; sourceId: string; open: boolean; onClose: () => void }) {
  const upload = useUploadSnapshot(orgId, sourceId);
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", "Documents are capped at 10 MB.");
      return;
    }
    setFileName(file.name);
    setContent(await file.text());
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    upload.mutate(content, {
      onSuccess: (r) => {
        toast.success(r.created ? `Snapshot v${r.snapshot?.version} stored` : "No change", r.created ? (r.diff_id ? "Diffing against the previous snapshot." : "This is the baseline.") : "The document is identical to the latest snapshot.");
        setContent("");
        setFileName(null);
        onClose();
      },
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Upload a document"
      description="Paste or choose an OpenAPI document (JSON or YAML). Identical content is not stored twice."
      footer={
        <Button type="submit" form="upload-form" size="lg" className="w-full" loading={upload.isPending} disabled={!content.trim()}>
          Upload snapshot
        </Button>
      }
    >
      <form id="upload-form" onSubmit={submit} className="flex flex-col gap-5 pb-2">
        <label className="pressable flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-separator-strong bg-surface-2 px-4 py-6 text-[14px] text-text-2 hover:bg-fill">
          <Download className="size-4" />
          {fileName ?? "Choose a .json or .yaml file"}
          <input type="file" accept=".json,.yaml,.yml,application/json,text/yaml" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <Textarea label="Or paste the document" value={content} onChange={(e) => setContent(e.target.value)} className="t-mono min-h-56" spellCheck={false} />
      </form>
    </Sheet>
  );
}

function SnapshotViewer({ orgId, sourceId, snapshotId, onClose }: { orgId: string; sourceId: string; snapshotId: string | null; onClose: () => void }) {
  const snap = useSnapshot(orgId, sourceId, snapshotId);
  return (
    <Sheet open={!!snapshotId} onClose={onClose} size="lg" title={snap.data ? `Snapshot v${snap.data.version}` : "Snapshot"} description={snap.data ? `${snap.data.spec_format.toUpperCase()} ${snap.data.spec_version_label ?? ""} · ${formatBytes(snap.data.byte_size)} · ${formatDateTime(snap.data.fetched_at)}` : undefined}>
      {snap.isPending ? <Skeleton className="h-64" /> : snap.isError ? <ErrorState message={messageOf(snap.error)} /> : <Code block className="max-h-[70dvh] text-[12px]">{snap.data.content}</Code>}
    </Sheet>
  );
}

