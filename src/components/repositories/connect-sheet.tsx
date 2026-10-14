"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, Lock } from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";
import { Badge, MockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { useAvailableRepos, useInstallations, useInstallUrl, useLinkInstallation } from "@/lib/api/hooks/github";
import { useConnectRepository } from "@/lib/api/hooks/repositories";
import type { Repository } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function ConnectRepositorySheet({ orgId, open, onClose, onConnected }: { orgId: string; open: boolean; onClose: () => void; onConnected?: (r: Repository) => void }) {
  const installations = useInstallations(orgId);
  const active = installations.data?.filter((i) => i.status === "active") ?? [];
  const [installationId, setInstallationId] = useState<string>("");
  const effectiveInstallation = installationId || active[0]?.id || null;
  const repos = useAvailableRepos(orgId, open ? effectiveInstallation : null);
  const connect = useConnectRepository(orgId);
  const [selected, setSelected] = useState<string>("");
  const [branch, setBranch] = useState("");
  const [filter, setFilter] = useState("");
  const fields = connect.error instanceof ApiError ? connect.error.fields : {};

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!effectiveInstallation || !selected) return;
    connect.mutate(
      { installation_id: effectiveInstallation, full_name: selected, ...(branch.trim() ? { branch: branch.trim() } : {}) },
      {
        onSuccess: (r) => {
          toast.success("Repository connected", "The first scan has been queued.");
          onConnected?.(r);
          onClose();
        },
      },
    );
  };

  const list = (repos.data ?? []).filter((r) => r.full_name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Connect a repository"
      description="Pick a repository from a linked GitHub installation. Its first scan starts right away."
      size="lg"
      footer={
        <Button type="submit" form="connect-form" size="lg" className="w-full" loading={connect.isPending} disabled={!selected || !effectiveInstallation}>
          Connect and scan
        </Button>
      }
    >
      {installations.isPending ? (
        <Skeleton className="h-40" />
      ) : !active.length ? (
        <LinkInstallation orgId={orgId} />
      ) : (
        <form id="connect-form" onSubmit={submit} className="flex flex-col gap-4 pb-2">
          {connect.error && !Object.keys(fields).length ? (
            <p role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">
              {connect.error.message}
            </p>
          ) : null}
          {active.length > 1 ? (
            <Select label="Installation" value={effectiveInstallation ?? ""} onChange={(e) => { setInstallationId(e.target.value); setSelected(""); }}>
              {active.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.account_login} ({i.account_type}){i.is_mock ? " · mock" : ""}
                </option>
              ))}
            </Select>
          ) : null}
          <Input label="Search repositories" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="owner/name" autoFocus />
          <div role="radiogroup" aria-label="Repository" className="card max-h-[40dvh] overflow-y-auto scroll-thin divide-y divide-separator">
            {repos.isPending ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : repos.isError ? (
              <p className="t-footnote p-4 text-danger">{repos.error.message}</p>
            ) : !list.length ? (
              <p className="t-footnote p-4 text-text-2">No repositories match.</p>
            ) : (
              list.map((r) => {
                const connected = !!r.connected_repository_id;
                const isSelected = selected === r.full_name;
                return (
                  <button
                    key={r.github_repo_id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={connected}
                    onClick={() => {
                      setSelected(r.full_name);
                      setBranch("");
                    }}
                    className={cn("pressable-row flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-50", isSelected ? "bg-accent-soft" : "hover:bg-surface-2")}
                  >
                    <Github className="size-5 shrink-0 text-text-2" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-medium text-text">{r.full_name}</span>
                        {r.is_private ? <Lock className="size-3.5 text-text-3" aria-label="Private" /> : null}
                        <MockBadge show={r.is_mock} />
                      </span>
                      <span className="t-caption text-text-2">
                        Default branch {r.default_branch}
                        {connected ? " · already connected" : ""}
                      </span>
                    </span>
                    <span className={cn("size-[18px] shrink-0 rounded-full border-2", isSelected ? "border-accent bg-accent" : "border-separator-strong")} aria-hidden>
                      {isSelected ? <span className="block size-full scale-50 rounded-full bg-white" /> : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {selected ? <Input label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder={repos.data?.find((r) => r.full_name === selected)?.default_branch ?? "default branch"} hint="Leave empty to watch the default branch." error={fields.branch} /> : null}
        </form>
      )}
    </Sheet>
  );
}

export function LinkInstallation({ orgId, compact }: { orgId: string; compact?: boolean }) {
  const installUrl = useInstallUrl(orgId, true);
  const link = useLinkInstallation(orgId);
  const [id, setId] = useState("");
  const isMock = installUrl.data?.is_mock;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    link.mutate(Number(id), { onSuccess: () => toast.success("Installation linked") });
  };

  return (
    <div className={cn("flex flex-col gap-4", !compact && "pb-2")}>
      <div className="rounded-[14px] bg-surface-2 p-4">
        <p className="t-headline text-text">1. Install the GitHub App</p>
        <p className="t-footnote mt-1 text-text-2">{installUrl.data?.note ?? "AutoAPI needs read access to code and metadata, plus pull-request write access to deliver repairs."}</p>
        {installUrl.data?.url ? (
          <a href={installUrl.data.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex">
            <Button variant="secondary" size="sm" trailing={<ExternalLink className="size-3.5" />}>
              Open GitHub
            </Button>
          </a>
        ) : null}
        {isMock ? <Badge tone="warning" className="mt-3">Development mock: use installation id 1</Badge> : null}
      </div>
      <form onSubmit={submit} className="rounded-[14px] bg-surface-2 p-4">
        <p className="t-headline text-text">2. Link the installation</p>
        <p className="t-footnote mt-1 text-text-2">After installing, GitHub redirects with an installation id. Paste it here.</p>
        <div className="mt-3 flex items-end gap-2">
          <Input label="Installation id" inputMode="numeric" pattern="[0-9]+" value={id} onChange={(e) => setId(e.target.value.replace(/\D/g, ""))} wrapperClassName="flex-1" error={link.error instanceof ApiError ? link.error.fields.installation_id : null} />
          <Button type="submit" loading={link.isPending} disabled={!id} className="h-11">
            Link
          </Button>
        </div>
        {link.error && !(link.error instanceof ApiError && Object.keys(link.error.fields).length) ? <p className="t-footnote mt-2 text-danger">{link.error.message}</p> : null}
      </form>
    </div>
  );
}
