"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { Diff, PageParams, Paginated, Snapshot, SnapshotDetail, SnapshotUploadResult, Source, SourceCreate, SourceUpdate } from "../types";

export function useSources(orgId: string, params: PageParams = {}) {
  return useQuery({
    queryKey: qk.sources(orgId).list(params),
    queryFn: ({ signal }) => api.get<Paginated<Source>>(`orgs/${orgId}/sources`, { ...params }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSource(orgId: string, sourceId: string) {
  return useQuery({
    queryKey: qk.sources(orgId).detail(sourceId),
    queryFn: () => api.get<Source>(`orgs/${orgId}/sources/${sourceId}`),
    // A fresh source is fetched by the worker shortly after creation; keep the card live.
    refetchInterval: (q) => (q.state.data && q.state.data.last_polled_at === null && q.state.data.url ? 4000 : false),
  });
}

function invalidateSources(qc: ReturnType<typeof useQueryClient>, orgId: string) {
  qc.invalidateQueries({ queryKey: qk.sources(orgId).all });
  qc.invalidateQueries({ queryKey: qk.jobs(orgId).all });
}

export function useCreateSource(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SourceCreate) => api.post<Source>(`orgs/${orgId}/sources`, body),
    onSuccess: () => invalidateSources(qc, orgId),
  });
}

export function useUpdateSource(orgId: string, sourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SourceUpdate) => api.patch<Source>(`orgs/${orgId}/sources/${sourceId}`, body),
    onSuccess: (source) => {
      qc.setQueryData(qk.sources(orgId).detail(sourceId), source);
      qc.invalidateQueries({ queryKey: qk.sources(orgId).all });
    },
  });
}

export function useDeleteSource(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => api.delete(`orgs/${orgId}/sources/${sourceId}`),
    onSuccess: () => invalidateSources(qc, orgId),
  });
}

export function useFetchSourceNow(orgId: string, sourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ job_id: string | null }>(`orgs/${orgId}/sources/${sourceId}/fetch`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sources(orgId).detail(sourceId) });
      qc.invalidateQueries({ queryKey: qk.jobs(orgId).all });
    },
  });
}

export function useUploadSnapshot(orgId: string, sourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.post<SnapshotUploadResult>(`orgs/${orgId}/sources/${sourceId}/snapshots`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sources(orgId).detail(sourceId) });
      qc.invalidateQueries({ queryKey: qk.snapshots(orgId, sourceId) });
      qc.invalidateQueries({ queryKey: qk.diffs(orgId, sourceId) });
      qc.invalidateQueries({ queryKey: qk.changes(orgId).all });
      qc.invalidateQueries({ queryKey: qk.findings(orgId).all });
    },
  });
}

export function useSnapshots(orgId: string, sourceId: string, params: PageParams = {}) {
  return useQuery({
    queryKey: [...qk.snapshots(orgId, sourceId), params],
    queryFn: ({ signal }) => api.get<Paginated<Snapshot>>(`orgs/${orgId}/sources/${sourceId}/snapshots`, { ...params }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSnapshot(orgId: string, sourceId: string, snapshotId: string | null) {
  return useQuery({
    queryKey: qk.snapshot(orgId, sourceId, snapshotId ?? ""),
    queryFn: () => api.get<SnapshotDetail>(`orgs/${orgId}/sources/${sourceId}/snapshots/${snapshotId}`),
    enabled: !!snapshotId,
    staleTime: Infinity, // snapshots are immutable
  });
}

export function useDiffs(orgId: string, sourceId: string, params: PageParams = {}) {
  return useQuery({
    queryKey: [...qk.diffs(orgId, sourceId), params],
    queryFn: ({ signal }) => api.get<Paginated<Diff>>(`orgs/${orgId}/sources/${sourceId}/diffs`, { ...params }, signal),
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (q.state.data?.items.some((d) => d.status === "pending") ? 4000 : false),
  });
}
