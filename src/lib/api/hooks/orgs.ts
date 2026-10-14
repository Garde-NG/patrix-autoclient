"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type {
  Invite,
  InviteCreated,
  Member,
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  OrganizationWithRole,
  OrgRole,
} from "../types";

export function useOrgs() {
  return useQuery({ queryKey: qk.orgs, queryFn: () => api.get<OrganizationWithRole[]>("orgs"), staleTime: 60_000 });
}

export function useOrg(orgId: string) {
  return useQuery({
    queryKey: qk.orgDetail(orgId),
    queryFn: () => api.get<OrganizationWithRole>(`orgs/${orgId}`),
    staleTime: 60_000,
  });
}

export function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OrganizationCreate) => api.post<Organization>("orgs", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orgs }),
  });
}

export function useUpdateOrg(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OrganizationUpdate) => api.patch<Organization>(`orgs/${orgId}`, body),
    onSuccess: (org) => {
      qc.setQueryData<OrganizationWithRole>(qk.orgDetail(orgId), (prev) => (prev ? { ...prev, ...org } : prev));
      qc.invalidateQueries({ queryKey: qk.orgs });
    },
  });
}

export function useMembers(orgId: string) {
  return useQuery({ queryKey: qk.members(orgId), queryFn: () => api.get<Member[]>(`orgs/${orgId}/members`) });
}

export function useUpdateMemberRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: OrgRole }) =>
      api.patch(`orgs/${orgId}/members/${memberId}`, { role }),
    onMutate: async ({ memberId, role }) => {
      await qc.cancelQueries({ queryKey: qk.members(orgId) });
      const previous = qc.getQueryData<Member[]>(qk.members(orgId));
      qc.setQueryData<Member[]>(qk.members(orgId), (list) => list?.map((m) => (m.id === memberId ? { ...m, role } : m)));
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(qk.members(orgId), ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.members(orgId) }),
  });
}

export function useRemoveMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.delete(`orgs/${orgId}/members/${memberId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.members(orgId) });
      qc.invalidateQueries({ queryKey: qk.usage(orgId) });
    },
  });
}

export function useInvites(orgId: string, enabled = true) {
  return useQuery({ queryKey: qk.invites(orgId), queryFn: () => api.get<Invite[]>(`orgs/${orgId}/invites`), enabled });
}

export function useCreateInvite(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role: OrgRole }) => api.post<InviteCreated>(`orgs/${orgId}/invites`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invites(orgId) }),
  });
}

export function useRevokeInvite(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => api.delete(`orgs/${orgId}/invites/${inviteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invites(orgId) }),
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.post<Organization>("invites/accept", { token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orgs }),
  });
}
