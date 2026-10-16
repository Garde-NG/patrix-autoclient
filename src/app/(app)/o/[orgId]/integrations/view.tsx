"use client";

import { useMemo } from "react";
import { ListChecks } from "lucide-react";
import { IntegrationRow, IntegrationSheet } from "@/components/integrations/integration-row";
import { useOrgContext } from "@/components/shell/org-provider";
import { ListGroup } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, SearchField } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page";
import { FilterBar, ListShell } from "@/components/shared/list-shell";
import { useIntegrations } from "@/lib/api/hooks/integrations";
import { useRepositories } from "@/lib/api/hooks/repositories";
import { useDebouncedParam, useListParams } from "@/lib/hooks/use-list-params";

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
  const [providerText, setProviderText] = useDebouncedParam(params.provider_key, (v) => update({ provider_key: v.toLowerCase().trim() }));
  const repoName = (id: string) => repos.data?.items.find((r) => r.id === id)?.full_name;

  return (
    <>
      <PageHeader title="Integrations" description="Every third-party SDK and API detected across your connected repositories, with evidence and confidence." />
      {/* Filters: two full-width rows on phones, one row on wider screens. */}
      <FilterBar className="grid grid-cols-2 gap-2 sm:flex">
        <Select
          size="sm"
          aria-label="Repository"
          wrapperClassName="col-span-2 min-w-0 sm:w-60 sm:shrink-0"
          value={params.repository_id}
          onChange={(repository_id) => update({ repository_id })}
          options={[{ value: "", label: "All repositories" }, ...(repos.data?.items.map((r) => ({ value: r.id, label: r.full_name })) ?? [])]}
        />
        <SearchField size="sm" aria-label="Provider" wrapperClassName="min-w-0 sm:w-48 sm:shrink-0" value={providerText} onChange={setProviderText} placeholder="Provider, e.g. stripe" />
        <Checkbox checked={params.include_stale} onChange={(include_stale) => update({ include_stale })} label={<span className="text-[13px] text-text-2">Include stale</span>} className="min-h-9 items-center self-center py-0 sm:shrink-0" />
      </FilterBar>
      <ListShell query={query} onPage={setPage} empty={<EmptyState icon={ListChecks} title="No integrations detected" description="Connect a repository and let its first scan finish. Manifests, lockfiles and source files are analysed." />}>
        {(items) => (
          <ListGroup>
            {items.map((i) => (
              <IntegrationRow key={i.id} integration={i} onClick={() => update({ open: i.id, page: params.page })} repoName={params.repository_id ? null : repoName(i.repository_id)} />
            ))}
          </ListGroup>
        )}
      </ListShell>
      <IntegrationSheet orgId={orgId} integrationId={params.open || null} onClose={() => update({ open: "", page: params.page })} />
    </>
  );
}
