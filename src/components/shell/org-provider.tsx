"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useOrg } from "@/lib/api/hooks/orgs";
import { ROLE_RANK, type OrganizationWithRole, type OrgRole } from "@/lib/api/types";
import { ApiError, messageOf } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface OrgContextValue {
  org: OrganizationWithRole;
  orgId: string;
  role: OrgRole;
  /** True when the caller's role is at least `minimum`. */
  can: (minimum: OrgRole) => boolean;
  isAdmin: boolean;
  isOwner: boolean;
}

const Ctx = createContext<OrgContextValue | null>(null);

export function OrgProvider({ orgId, children }: { orgId: string; children: ReactNode }) {
  const query = useOrg(orgId);

  useEffect(() => {
    if (query.data) {
      try {
        localStorage.setItem("autoapi.lastOrg", orgId);
      } catch {}
    }
  }, [query.data, orgId]);

  const value = useMemo<OrgContextValue | null>(() => {
    if (!query.data) return null;
    const role = query.data.role;
    return {
      org: query.data,
      orgId,
      role,
      can: (minimum) => ROLE_RANK[role] >= ROLE_RANK[minimum],
      isAdmin: ROLE_RANK[role] >= ROLE_RANK.admin,
      isOwner: role === "owner",
    };
  }, [query.data, orgId]);

  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" aria-busy>
        <Skeleton className="mb-6 h-9 w-56" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[18px]" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !value) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        {notFound ? (
          <EmptyState
            icon={Building2}
            title="Workspace not found"
            description="It may have been deleted, or you may no longer be a member."
            action={
              <Link href="/orgs">
                <Button variant="secondary">Choose a workspace</Button>
              </Link>
            }
          />
        ) : (
          <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />
        )}
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrgContext(): OrgContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrgContext must be used inside OrgProvider");
  return ctx;
}
