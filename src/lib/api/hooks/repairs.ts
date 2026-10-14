"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import { useOnSettled } from "@/lib/query/use-on-settled";
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
  const query = useQuery({
    queryKey: qk.repairs(orgId).detail(jobId),
    queryFn: () => api.get<RepairJobDetail>(`orgs/${orgId}/repairs/${jobId}`),
    // Poll while the repair is in flight. Side effects must not live in this callback (see useOnSettled).
    refetchInterval: (q) => (q.state.data && LIVE_REPAIR.has(q.state.data.status) ? 3000 : false),
  });

  // The repair just finished: its finding and any pull request it delivered changed too.
  const live = query.data ? LIVE_REPAIR.has(query.data.status) : undefined;
  useOnSettled(live, () => {
    qc.invalidateQueries({ queryKey: qk.findings(orgId).all });
    qc.invalidateQueries({ queryKey: qk.pullRequests(orgId).all });
  });

  return query;
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
