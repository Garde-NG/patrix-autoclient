"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { Integration, IntegrationDetail, IntegrationFilters, Paginated } from "../types";

export function useIntegrations(orgId: string, filters: IntegrationFilters = {}) {
  return useQuery({
    queryKey: qk.integrations(orgId).list(filters),
    queryFn: ({ signal }) => api.get<Paginated<Integration>>(`orgs/${orgId}/integrations`, { ...filters }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useIntegration(orgId: string, integrationId: string | null) {
  return useQuery({
    queryKey: qk.integrations(orgId).detail(integrationId ?? ""),
    queryFn: () => api.get<IntegrationDetail>(`orgs/${orgId}/integrations/${integrationId}`),
    enabled: !!integrationId,
  });
}
