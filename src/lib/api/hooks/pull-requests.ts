"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { Paginated, PullRequest, PullRequestDetail, PullRequestFilters } from "../types";

export function usePullRequests(orgId: string, filters: PullRequestFilters = {}) {
  return useQuery({
    queryKey: qk.pullRequests(orgId).list(filters),
    queryFn: ({ signal }) => api.get<Paginated<PullRequest>>(`orgs/${orgId}/pull-requests`, { ...filters }, signal),
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (q.state.data?.items.some((p) => p.state === "pending") ? 4000 : false),
  });
}

export function usePullRequest(orgId: string, prId: string) {
  return useQuery({
    queryKey: qk.pullRequests(orgId).detail(prId),
    queryFn: () => api.get<PullRequestDetail>(`orgs/${orgId}/pull-requests/${prId}`),
    refetchInterval: (q) => (q.state.data?.state === "pending" ? 3000 : false),
  });
}

export function useSyncPullRequest(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prId: string) => api.post<PullRequest>(`orgs/${orgId}/pull-requests/${prId}/sync`),
    onSuccess: (pr) => {
      qc.setQueryData<PullRequestDetail>(qk.pullRequests(orgId).detail(pr.id), (prev) => (prev ? { ...prev, ...pr } : prev));
      qc.invalidateQueries({ queryKey: qk.pullRequests(orgId).all });
      qc.invalidateQueries({ queryKey: qk.findings(orgId).all });
    },
  });
}
