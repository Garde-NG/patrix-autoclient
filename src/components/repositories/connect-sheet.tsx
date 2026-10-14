"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, ExternalLink, GitBranch, Lock } from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";
import { MockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, SearchField } from "@/components/ui/field";
import { OptionList } from "@/components/ui/option-list";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { useAvailableRepos, useBranches, useInstallations, useInstallUrl, useLinkInstallation } from "@/lib/api/hooks/github";
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
  const branches = useBranches(orgId, effectiveInstallation, selected || null);
  const selectedRepo = repos.data?.find((r) => r.full_name === selected);
  // The default branch is preselected until a person picks another one.
  const effectiveBranch = branch || branches.data?.find((b) => b.is_default)?.name || selectedRepo?.default_branch || "";
  const fields = connect.error instanceof ApiError ? connect.error.fields : {};

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!effectiveInstallation || !selected) return;
    connect.mutate(
      { installation_id: effectiveInstallation, full_name: selected, ...(effectiveBranch.trim() ? { branch: effectiveBranch.trim() } : {}) },
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
        <form id="connect-form" onSubmit={submit} className="flex flex-col gap-5 pb-2">
          {connect.error && !Object.keys(fields).length ? (
            <p role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">
              {connect.error.message}
            </p>
          ) : null}
          {active.length > 1 ? (
            <Select
              label="Installation"
              value={effectiveInstallation ?? ""}
              onChange={(v) => {
                setInstallationId(v);
                setSelected("");
              }}
              options={active.map((i) => ({ value: i.id, label: i.account_login, description: `${i.account_type}${i.is_mock ? " · mock" : ""}` }))}
            />
          ) : null}
          <SearchField value={filter} onChange={setFilter} placeholder="Search repositories, owner/name" aria-label="Search repositories" autoFocus />
          {repos.isPending ? (
            <div className="card space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : repos.isError ? (
            <p className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">{repos.error.message}</p>
          ) : (
            <OptionList
              ariaLabel="Repository"
              className="max-h-[40dvh] overflow-y-auto scroll-thin"
              value={selected || null}
              onChange={(v) => {
                setSelected(v);
                setBranch("");
              }}
              emptyLabel="No repositories match."
              options={list.map((r) => ({
                value: r.full_name,
                disabled: !!r.connected_repository_id,
                leading: <Github className="size-5 text-text-2" />,
                title: (
                  <>
                    {r.full_name}
                    {r.is_private ? <Lock className="size-3.5 text-text-3" aria-label="Private" /> : null}
                    <MockBadge show={r.is_mock} />
                  </>
                ),
                description: `Default branch ${r.default_branch}${r.connected_repository_id ? " · already connected" : ""}`,
              }))}
            />
          )}
          {selected ? (
            branches.isError ? (
              <Input label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder={selectedRepo?.default_branch ?? "main"} hint="Couldn't list branches; type the branch to watch." error={fields.branch} />
            ) : (
              <Select
                label="Branch to watch"
                value={effectiveBranch}
                onChange={setBranch}
                disabled={branches.isPending}
                placeholder={branches.isPending ? "Loading branches…" : "Choose a branch"}
                error={fields.branch}
                hint="Pushes to this branch trigger a re-scan, and repairs are proposed against it."
                options={(branches.data ?? []).map((b) => ({
                  value: b.name,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <GitBranch className="size-3.5 text-text-2" /> {b.name}
                    </span>
                  ),
                  description: b.is_default ? "Default branch" : b.protected ? "Protected" : undefined,
                }))}
              />
            )
          ) : null}
        </form>
      )}
    </Sheet>
  );
}

export function LinkInstallation({ orgId, compact }: { orgId: string; compact?: boolean }) {
  const installUrl = useInstallUrl(orgId, true);
  const link = useLinkInstallation(orgId);
  const [id, setId] = useState("");
  const [manual, setManual] = useState(false);
  const isMock = installUrl.data?.is_mock;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    link.mutate(Number(id), { onSuccess: () => toast.success("Installation linked") });
  };

  return (
    <div className={cn("flex flex-col gap-4", !compact && "pb-2")}>
      <div className="rounded-[14px] bg-surface-2 p-4">
        <p className="t-headline text-text">Install the GitHub App</p>
        <p className="t-footnote mt-1 text-text-2">
          {isMock
            ? installUrl.data?.note
            : "AutoAPI needs read access to code and metadata, plus pull-request write access to deliver repairs. GitHub brings you straight back here and the installation is linked for you."}
        </p>
        {installUrl.data?.url ? (
          <a href={installUrl.data.url} className="mt-3 inline-flex">
            <Button leading={<Github className="size-4" />} trailing={<ExternalLink className="size-3.5" />}>
              Install on GitHub
            </Button>
          </a>
        ) : null}
        {isMock ? (
          <Button className="mt-3" variant="tinted" size="sm" loading={link.isPending} onClick={() => link.mutate(1, { onSuccess: () => toast.success("Mock installation linked") })}>
            Link the mock installation
          </Button>
        ) : null}
      </div>
      {!isMock ? (
        <div className="rounded-[14px] bg-surface-2">
          <button type="button" onClick={() => setManual((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left" aria-expanded={manual}>
            <span>
              <span className="t-body block font-medium text-text">Link an existing installation</span>
              <span className="t-footnote block text-text-2">Already installed? Paste the installation id from GitHub.</span>
            </span>
            <ChevronDown className={cn("size-4 shrink-0 text-text-2 transition-transform", manual && "rotate-180")} />
          </button>
          {manual ? (
            <form onSubmit={submit} className="border-t border-separator px-4 pb-4 pt-3">
              <div className="flex items-end gap-2">
                <Input label="Installation id" inputMode="numeric" pattern="[0-9]+" value={id} onChange={(e) => setId(e.target.value.replace(/\D/g, ""))} wrapperClassName="flex-1" hint="GitHub → Settings → Applications → Configure; the number at the end of the URL." error={link.error instanceof ApiError ? link.error.fields.installation_id : null} />
                <Button type="submit" loading={link.isPending} disabled={!id} className="mb-7 h-11">
                  Link
                </Button>
              </div>
              {link.error && !(link.error instanceof ApiError && Object.keys(link.error.fields).length) ? <p className="t-footnote mt-2 text-danger">{link.error.message}</p> : null}
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
