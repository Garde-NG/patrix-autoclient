"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { Finding, FindingFilters, Paginated, RepairJob } from "../types";

export function useFindings(orgId: string, filters: FindingFilters = {}) {
  return useQuery({
    queryKey: qk.findings(orgId).list(filters),
    queryFn: ({ signal }) => api.get<Paginated<Finding>>(`orgs/${orgId}/findings`, { ...filters }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useFinding(orgId: string, findingId: string) {
  return useQuery({
    queryKey: qk.findings(orgId).detail(findingId),
    queryFn: () => api.get<Finding>(`orgs/${orgId}/findings/${findingId}`),
  });
}

type FindingAction = "acknowledge" | "dismiss" | "reopen";

export function useFindingAction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ findingId, action }: { findingId: string; action: FindingAction }) =>
      api.post<Finding>(`orgs/${orgId}/findings/${findingId}/${action}`),
    onSuccess: (finding) => {
      qc.setQueryData(qk.findings(orgId).detail(finding.id), finding);
      // Lists are filtered by status server-side; refetch rather than patching in place.
      qc.invalidateQueries({ queryKey: qk.findings(orgId).all, refetchType: "active" });
      qc.invalidateQueries({ queryKey: qk.repositories(orgId).all });
    },
  });
}

export function useRequestRepair(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (findingId: string) => api.post<RepairJob>(`orgs/${orgId}/findings/${findingId}/repairs`),
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: qk.repairs(orgId).all });
      qc.invalidateQueries({ queryKey: qk.findings(orgId).detail(job.finding_id) });
      qc.invalidateQueries({ queryKey: qk.usage(orgId) });
    },
  });
}
