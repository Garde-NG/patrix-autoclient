"use client";

import Link from "next/link";
import { ArrowRight, FolderGit2, Plug, ShieldAlert, Wrench } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { useUser } from "@/components/shell/user-provider";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Section, Stat } from "@/components/ui/page";
import { ListSkeleton, StatSkeleton } from "@/components/ui/skeleton";
import { Operation } from "@/components/shared/operation";
import { useChanges } from "@/lib/api/hooks/changes";
import { useFindings } from "@/lib/api/hooks/findings";
import { useRepairs } from "@/lib/api/hooks/repairs";
import { useRepositories } from "@/lib/api/hooks/repositories";
import { useSources } from "@/lib/api/hooks/sources";
import { useUsage } from "@/lib/api/hooks/billing";
import { formatNumber, humanize, timeAgo } from "@/lib/utils";

export default function OverviewPage() {
  const { org, orgId, isAdmin } = useOrgContext();
  const user = useUser();
  const breaking = useFindings(orgId, { severity: "breaking", page_size: 1 });
  const openFindings = useFindings(orgId, { page_size: 5 });
  const repos = useRepositories(orgId, { page_size: 1 });
  const sources = useSources(orgId, { page_size: 1 });
  const changes = useChanges(orgId, { page_size: 5 });
  const repairs = useRepairs(orgId, { page_size: 4 });
  const usage = useUsage(orgId);

  const loadingStats = breaking.isPending || repos.isPending || sources.isPending || openFindings.isPending;
  const noSetup = !loadingStats && repos.data?.meta.total_items === 0 && sources.data?.meta.total_items === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader eyebrow={org.name} title={`${greeting}, ${user.name.split(" ")[0]}`} description="Here's what changed in the APIs your code depends on." />

      {noSetup ? (
        <Section>
          <div className="card overflow-hidden">
            <div className="bg-[radial-gradient(80%_120%_at_0%_0%,var(--accent-soft),transparent_60%)] p-6 sm:p-8">
              <h2 className="t-title text-text">Set up monitoring in two steps</h2>
              <p className="t-body mt-1.5 max-w-xl text-text-2">Connect a repository so AutoAPI can discover the third-party APIs it uses, then watch those providers for breaking changes.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <SetupCard icon={FolderGit2} step="1" title="Connect a repository" body="Link your GitHub App installation and pick a repository. Its first scan starts right away." href={`/o/${orgId}/repositories`} cta="Connect" disabled={!isAdmin} />
                <SetupCard icon={Plug} step="2" title="Add an API source" body="Point at a provider's OpenAPI document, or upload one. Detected SDKs attach sources automatically." href={`/o/${orgId}/sources`} cta="Add source" disabled={!isAdmin} />
              </div>
              {!isAdmin ? <p className="t-footnote mt-4 text-text-2">Ask a workspace admin to complete setup.</p> : null}
            </div>
          </div>
        </Section>
      ) : null}

      <Section>
        {loadingStats ? (
          <StatSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Breaking findings" value={formatNumber(breaking.data?.meta.total_items ?? 0)} tone={breaking.data?.meta.total_items ? "danger" : undefined} href={`/o/${orgId}/findings?severity=breaking`} hint="Open, not dismissed" />
            <Stat label="Open findings" value={formatNumber(openFindings.data?.meta.total_items ?? 0)} href={`/o/${orgId}/findings`} hint="All severities" />
            <Stat label="Repositories" value={formatNumber(repos.data?.meta.total_items ?? 0)} href={`/o/${orgId}/repositories`} hint="Connected" />
            <Stat label="API sources" value={formatNumber(sources.data?.meta.total_items ?? 0)} href={`/o/${orgId}/sources`} hint="Monitored" />
          </div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <Section title="Latest findings" action={<SeeAll href={`/o/${orgId}/findings`} />}>
            {openFindings.isPending ? (
              <ListSkeleton rows={4} />
            ) : !openFindings.data?.items.length ? (
              <EmptyState compact icon={ShieldAlert} title="No open findings" description="When a monitored API changes in a way that may affect your code, it shows up here." />
            ) : (
              <ListGroup>
                {openFindings.data.items.map((f) => (
                  <Link key={f.id} href={`/o/${orgId}/findings/${f.id}`} className="pressable-row flex items-start gap-3 px-4 py-3.5 hover:bg-surface-2">
                    <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${f.severity === "breaking" ? "bg-danger" : f.severity === "warning" ? "bg-warning" : "bg-text-3"}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-text">{f.title}</span>
                      <span className="t-footnote line-clamp-1 text-text-2">{f.summary}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={f.status} />
                      <span className="t-caption text-text-3">{timeAgo(f.created_at)}</span>
                    </span>
                  </Link>
                ))}
              </ListGroup>
            )}
          </Section>

          <Section title="Recent API changes" action={<SeeAll href={`/o/${orgId}/changes`} />}>
            {changes.isPending ? (
              <ListSkeleton rows={4} />
            ) : !changes.data?.items.length ? (
              <EmptyState compact icon={Plug} title="No changes detected yet" description="Changes appear once a source has two snapshots to compare." />
            ) : (
              <ListGroup>
                {changes.data.items.map((c) => (
                  <Link key={c.id} href={`/o/${orgId}/changes/${c.id}`} className="pressable-row flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                    <SeverityBadge severity={c.severity} className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-text">{c.summary}</span>
                      <Operation method={c.operation_method} path={c.operation_path} className="t-caption max-w-full" />
                    </span>
                    <span className="t-caption shrink-0 text-text-3">{timeAgo(c.created_at)}</span>
                  </Link>
                ))}
              </ListGroup>
            )}
          </Section>
        </div>

        <div className="min-w-0 lg:col-span-2">
          <Section title="Repairs in flight" action={<SeeAll href={`/o/${orgId}/repairs`} />}>
            {repairs.isPending ? (
              <ListSkeleton rows={3} />
            ) : !repairs.data?.items.length ? (
              <EmptyState compact icon={Wrench} title="No repairs yet" description="Request a repair from a repository-level finding." />
            ) : (
              <ListGroup>
                {repairs.data.items.map((r) => (
                  <Link key={r.id} href={`/o/${orgId}/repairs/${r.id}`} className="pressable-row flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-text">Repair {r.id.slice(0, 8)}</span>
                      <span className="t-caption text-text-2">
                        Attempt {r.attempt_count}/{r.max_attempts} · {timeAgo(r.updated_at)}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </ListGroup>
            )}
          </Section>

          <Section title="Plan usage" description={usage.data ? `${usage.data.plan_name} plan` : undefined} action={<SeeAll href={`/o/${orgId}/billing`} label="Manage" />}>
            {usage.isPending ? (
              <ListSkeleton rows={3} />
            ) : usage.data ? (
              <ListGroup>
                {Object.entries(usage.data.metrics).map(([key, m]) => {
                  const pct = m.limit ? Math.min(100, Math.round((m.used / m.limit) * 100)) : 0;
                  return (
                    <div key={key} className="px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="t-body text-text">{humanize(key.replace("_per_month", ""))}</span>
                        <span className="t-footnote tabular-nums text-text-2">
                          {formatNumber(m.used)} / {m.limit === null ? "∞" : formatNumber(m.limit)}
                          {m.period === "month" ? <span className="text-text-3"> · mo</span> : null}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill">
                        <div className={`h-full rounded-full transition-[width] duration-500 ${pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-accent"}`} style={{ width: `${m.limit ? pct : 8}%` }} />
                      </div>
                    </div>
                  );
                })}
              </ListGroup>
            ) : null}
          </Section>
        </div>
      </div>
    </>
  );
}

function SeeAll({ href, label = "See all" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="pressable inline-flex items-center gap-0.5 rounded-md text-[14px] font-medium text-accent hover:underline">
      {label} <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function SetupCard({ icon: Icon, step, title, body, href, cta, disabled }: { icon: typeof FolderGit2; step: string; title: string; body: string; href: string; cta: string; disabled?: boolean }) {
  return (
    <div className="flex flex-col rounded-[16px] border border-separator bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
          <Icon className="size-5" strokeWidth={1.9} />
        </span>
        <div>
          <p className="t-caption font-semibold uppercase tracking-wide text-text-3">Step {step}</p>
          <p className="t-headline text-text">{title}</p>
        </div>
      </div>
      <p className="t-footnote mt-3 flex-1 text-text-2">{body}</p>
      <Link href={href} className="mt-4" aria-disabled={disabled}>
        <Button variant="tinted" size="sm" disabled={disabled} className="w-full sm:w-auto">
          {cta}
        </Button>
      </Link>
    </div>
  );
}
