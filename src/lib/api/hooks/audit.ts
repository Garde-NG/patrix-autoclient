"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { AuditEvent, AuditFilters, Paginated } from "../types";

export function useAudit(orgId: string, filters: AuditFilters = {}, enabled = true) {
  return useQuery({
    queryKey: qk.audit(orgId).list(filters),
    queryFn: ({ signal }) => api.get<Paginated<AuditEvent>>(`orgs/${orgId}/audit`, { ...filters }, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}
