"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { Paginated, RepairFilters, RepairJob, RepairJobDetail, RepairStatus } from "../types";

export const LIVE_REPAIR: ReadonlySet<RepairStatus> = new Set<RepairStatus>(["queued", "generating", "generated", "verifying", "delivering"]);

export function useRepairs(orgId: string, filters: RepairFilters = {}) {
  return useQuery({
    queryKey: qk.repairs(orgId).list(filters),
    queryFn: ({ signal }) => api.get<Paginated<RepairJob>>(`orgs/${orgId}/repairs`, { ...filters }, signal),
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (q.state.data?.items.some((r) => LIVE_REPAIR.has(r.status)) ? 4000 : false),
  });
}

export function useRepair(orgId: string, jobId: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.repairs(orgId).detail(jobId),
    queryFn: () => api.get<RepairJobDetail>(`orgs/${orgId}/repairs/${jobId}`),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status && LIVE_REPAIR.has(status)) return 3000;
      if (q.state.dataUpdateCount > 1) {
        qc.invalidateQueries({ queryKey: qk.findings(orgId).all });
        qc.invalidateQueries({ queryKey: qk.pullRequests(orgId).all });
      }
      return false;
    },
  });
}

type RepairAction = "retry" | "deliver" | "cancel";

export function useRepairAction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, action }: { jobId: string; action: RepairAction }) => api.post<RepairJob>(`orgs/${orgId}/repairs/${jobId}/${action}`),
    onSuccess: (job) => {
      qc.setQueryData<RepairJobDetail>(qk.repairs(orgId).detail(job.id), (prev) => (prev ? { ...prev, ...job } : prev));
      qc.invalidateQueries({ queryKey: qk.repairs(orgId).all });
      qc.invalidateQueries({ queryKey: qk.usage(orgId) });
    },
  });
}
