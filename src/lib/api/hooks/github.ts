"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { AvailableRepo, Branch, Installation, InstallUrl, SetupResult } from "../types";

export function useInstallUrl(orgId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.installUrl(orgId),
    queryFn: () => api.get<InstallUrl>(`orgs/${orgId}/github/install-url`),
    enabled,
    staleTime: 10 * 60_000,
  });
}

export function useInstallations(orgId: string) {
  return useQuery({
    queryKey: qk.installations(orgId),
    queryFn: () => api.get<Installation[]>(`orgs/${orgId}/github/installations`),
  });
}

export function useLinkInstallation(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (installation_id: number) => api.post<Installation>(`orgs/${orgId}/github/installations`, { installation_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.installations(orgId) }),
  });
}

export function useUnlinkInstallation(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rowId: string) => api.delete(`orgs/${orgId}/github/installations/${rowId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.installations(orgId) });
      qc.invalidateQueries({ queryKey: qk.repositories(orgId).all });
    },
  });
}

export function useAvailableRepos(orgId: string, installationRowId: string | null) {
  return useQuery({
    queryKey: qk.availableRepos(orgId, installationRowId ?? ""),
    queryFn: () => api.get<AvailableRepo[]>(`orgs/${orgId}/github/installations/${installationRowId}/repositories`),
    enabled: !!installationRowId,
    staleTime: 60_000,
  });
}

export function useBranches(orgId: string, installationRowId: string | null, fullName: string | null) {
  return useQuery({
    queryKey: ["orgs", orgId, "github", "installations", installationRowId ?? "", "branches", fullName ?? ""],
    queryFn: () => api.get<Branch[]>(`orgs/${orgId}/github/installations/${installationRowId}/repositories/${fullName}/branches`),
    enabled: !!installationRowId && !!fullName,
    staleTime: 60_000,
  });
}

/** Finishes GitHub's post-install redirect; the signed `state` names the workspace. */
export function useCompleteGitHubSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { installation_id: number; state: string }) => api.post<SetupResult>("github/setup", body),
    onSuccess: (r) => qc.invalidateQueries({ queryKey: qk.installations(r.organization_id) }),
    meta: { silent: true },
  });
}
