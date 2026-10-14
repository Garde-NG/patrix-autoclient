"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { PageParams, Paginated, Repository, RepositoryConnect, RepositorySummary, RepositoryUpdate, Scan } from "../types";

const LIVE = new Set(["queued", "running"]);

export function useRepositories(orgId: string, params: PageParams = {}) {
  return useQuery({
    queryKey: qk.repositories(orgId).list(params),
    queryFn: ({ signal }) => api.get<Paginated<RepositorySummary>>(`orgs/${orgId}/repositories`, { ...params }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useRepository(orgId: string, repoId: string) {
  return useQuery({
    queryKey: qk.repositories(orgId).detail(repoId),
    queryFn: () => api.get<Repository>(`orgs/${orgId}/repositories/${repoId}`),
  });
}

export function useConnectRepository(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RepositoryConnect) => api.post<Repository>(`orgs/${orgId}/repositories`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.repositories(orgId).all });
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "github"] });
      qc.invalidateQueries({ queryKey: qk.usage(orgId) });
      qc.invalidateQueries({ queryKey: qk.jobs(orgId).all });
    },
  });
}

export function useUpdateRepository(orgId: string, repoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RepositoryUpdate) => api.patch<Repository>(`orgs/${orgId}/repositories/${repoId}`, body),
    onSuccess: (repo) => {
      qc.setQueryData(qk.repositories(orgId).detail(repoId), repo);
      qc.invalidateQueries({ queryKey: qk.repositories(orgId).all });
    },
  });
}

export function useDisconnectRepository(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoId: string) => api.delete(`orgs/${orgId}/repositories/${repoId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.repositories(orgId).all });
      qc.invalidateQueries({ queryKey: qk.integrations(orgId).all });
      qc.invalidateQueries({ queryKey: qk.usage(orgId) });
    },
  });
}

export function useScanNow(orgId: string, repoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Scan>(`orgs/${orgId}/repositories/${repoId}/scan`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.scans(orgId, repoId) });
      qc.invalidateQueries({ queryKey: qk.repositories(orgId).detail(repoId) });
      qc.invalidateQueries({ queryKey: qk.jobs(orgId).all });
      qc.invalidateQueries({ queryKey: qk.usage(orgId) });
    },
  });
}

export function useScans(orgId: string, repoId: string, params: PageParams = {}) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: [...qk.scans(orgId, repoId), params],
    queryFn: async ({ signal }) => {
      const data = await api.get<Paginated<Scan>>(`orgs/${orgId}/repositories/${repoId}/scans`, { ...params }, signal);
      return data;
    },
    placeholderData: keepPreviousData,
    refetchInterval: (q) => {
      const live = q.state.data?.items.some((s) => LIVE.has(s.status));
      if (!live) {
        // A scan just finished: the repository summary, integrations and findings changed too.
        if (q.state.dataUpdateCount > 1) {
          qc.invalidateQueries({ queryKey: qk.repositories(orgId).detail(repoId) });
          qc.invalidateQueries({ queryKey: qk.integrations(orgId).all });
          qc.invalidateQueries({ queryKey: qk.findings(orgId).all });
        }
        return false;
      }
      return 3000;
    },
  });
}
