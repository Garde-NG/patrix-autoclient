"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { Job, JobFilters, Paginated } from "../types";

export function useJobs(orgId: string, filters: JobFilters = {}) {
  return useQuery({
    queryKey: qk.jobs(orgId).list(filters),
    queryFn: ({ signal }) => api.get<Paginated<Job>>(`orgs/${orgId}/jobs`, { ...filters }, signal),
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (q.state.data?.items.some((j) => j.status === "queued" || j.status === "running") ? 4000 : false),
  });
}

export function useJob(orgId: string, jobId: string | null) {
  return useQuery({
    queryKey: qk.jobs(orgId).detail(jobId ?? ""),
    queryFn: () => api.get<Job>(`orgs/${orgId}/jobs/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (q) => (q.state.data && (q.state.data.status === "queued" || q.state.data.status === "running") ? 3000 : false),
  });
}

export function useJobAction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, action }: { jobId: string; action: "retry" | "cancel" }) => api.post(`orgs/${orgId}/jobs/${jobId}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.jobs(orgId).all }),
  });
}
