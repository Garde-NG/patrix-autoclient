"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { ApiChange, ApiChangeDetail, ChangeFilters, Paginated } from "../types";

export function useChanges(orgId: string, filters: ChangeFilters = {}) {
  return useQuery({
    queryKey: qk.changes(orgId).list(filters),
    queryFn: ({ signal }) => api.get<Paginated<ApiChange>>(`orgs/${orgId}/changes`, { ...filters }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useChange(orgId: string, changeId: string) {
  return useQuery({
    queryKey: qk.changes(orgId).detail(changeId),
    queryFn: () => api.get<ApiChangeDetail>(`orgs/${orgId}/changes/${changeId}`),
    staleTime: 5 * 60_000,
  });
}
