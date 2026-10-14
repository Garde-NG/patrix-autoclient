"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { Notification, PageParams, Paginated } from "../types";

interface Filters extends PageParams {
  unread_only?: boolean;
}

export function useNotifications(orgId: string, filters: Filters = {}) {
  return useQuery({
    queryKey: qk.notifications(orgId).list(filters),
    queryFn: ({ signal }) => api.get<Paginated<Notification>>(`orgs/${orgId}/notifications`, { ...filters }, signal),
    placeholderData: keepPreviousData,
  });
}

/** Lightweight unread count for the bell; polls gently while the tab is visible. */
export function useUnreadCount(orgId: string) {
  return useQuery({
    queryKey: qk.notifications(orgId).list({ unread_only: true, page_size: 1, badge: true }),
    queryFn: ({ signal }) =>
      api.get<Paginated<Notification>>(`orgs/${orgId}/notifications`, { unread_only: true, page_size: 1 }, signal),
    select: (data) => data.meta.total_items,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Notification>(`orgs/${orgId}/notifications/${id}/read`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.notifications(orgId).all });
      const now = new Date().toISOString();
      qc.setQueriesData<Paginated<Notification>>({ queryKey: qk.notifications(orgId).all }, (data) =>
        data ? { ...data, items: data.items.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? now } : n)) } : data,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notifications(orgId).all }),
    meta: { silent: true },
  });
}

export function useMarkAllRead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ updated: number }>(`orgs/${orgId}/notifications/read-all`),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notifications(orgId).all }),
  });
}

export function useDismissNotification(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Notification>(`orgs/${orgId}/notifications/${id}/dismiss`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.notifications(orgId).all });
      qc.setQueriesData<Paginated<Notification>>({ queryKey: qk.notifications(orgId).all }, (data) =>
        data ? { ...data, items: data.items.filter((n) => n.id !== id) } : data,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notifications(orgId).all }),
  });
}
