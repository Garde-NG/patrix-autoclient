"use client";

import { useMemo } from "react";
import { ListChecks } from "lucide-react";
import { IntegrationRow, IntegrationSheet } from "@/components/integrations/integration-row";
import { useOrgContext } from "@/components/shell/org-provider";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page";
import { FilterBar, ListShell, Toolbar } from "@/components/shared/list-shell";
import { useIntegrations } from "@/lib/api/hooks/integrations";
import { useRepositories } from "@/lib/api/hooks/repositories";
import { useListParams } from "@/lib/hooks/use-list-params";

const DEFAULTS = { repository_id: "", provider_key: "", include_stale: false, open: "" };

export default function IntegrationsPage() {
  const { orgId } = useOrgContext();
  const { params, update, setPage } = useListParams(DEFAULTS);
  const repos = useRepositories(orgId, { page_size: 100 });
  const filters = useMemo(
    () => ({ page: params.page, page_size: 20, repository_id: params.repository_id || undefined, provider_key: params.provider_key || undefined, include_stale: params.include_stale || undefined }),
    [params],
  );
  const query = useIntegrations(orgId, filters);
  const repoName = (id: string) => repos.data?.items.find((r) => r.id === id)?.full_name;

  return (
    <>
      <PageHeader title="Integrations" description="Every third-party SDK and API detected across your connected repositories, with evidence and confidence." />
      <Toolbar>
        <FilterBar className="mb-0 flex-nowrap">
          <Select value={params.repository_id} onChange={(e) => update({ repository_id: e.target.value })} wrapperClassName="w-56 shrink-0" className="h-9 text-[13px]" aria-label="Repository">
            <option value="">All repositories</option>
            {repos.data?.items.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name}
              </option>
            ))}
          </Select>
          <Input value={params.provider_key} onChange={(e) => update({ provider_key: e.target.value.toLowerCase() })} placeholder="Provider, e.g. stripe" wrapperClassName="w-44 shrink-0" className="h-9 text-[13px]" aria-label="Provider" />
          <label className="flex shrink-0 items-center gap-2 text-[13px] text-text-2">
            <input type="checkbox" checked={params.include_stale} onChange={(e) => update({ include_stale: e.target.checked })} className="size-4 accent-[var(--accent)]" />
            Include stale
          </label>
        </FilterBar>
      </Toolbar>
      <ListShell query={query} onPage={setPage} empty={<EmptyState icon={ListChecks} title="No integrations detected" description="Connect a repository and let its first scan finish. Manifests, lockfiles and source files are analysed." />}>
        {(items) => (
          <ListGroup>
            {items.map((i) => (
              <div key={i.id} className="relative">
                <IntegrationRow integration={i} onClick={() => update({ open: i.id, page: params.page })} showRepo />
                {!params.repository_id ? <span className="t-caption pointer-events-none absolute bottom-1.5 left-[68px] text-text-3">{repoName(i.repository_id) ?? ""}</span> : null}
              </div>
            ))}
          </ListGroup>
        )}
      </ListShell>
      <IntegrationSheet orgId={orgId} integrationId={params.open || null} onClose={() => update({ open: "", page: params.page })} />
    </>
  );
}
