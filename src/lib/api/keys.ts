/**
 * Query-key factory. Keys are hierarchical so invalidation can be as broad or narrow as needed:
 *   qk.org(id)                 -> everything about one organization
 *   qk.findings(id).all        -> every findings list and detail in that org
 *   qk.findings(id).list(f)    -> one filtered page
 */

const scoped = <F extends object>(orgId: string, resource: string) => ({
  all: ["orgs", orgId, resource] as const,
  list: (filters?: F) => ["orgs", orgId, resource, "list", filters ?? {}] as const,
  detail: (id: string) => ["orgs", orgId, resource, "detail", id] as const,
});

export const qk = {
  me: ["me"] as const,
  orgs: ["orgs"] as const,
  org: (orgId: string) => ["orgs", orgId] as const,
  orgDetail: (orgId: string) => ["orgs", orgId, "detail"] as const,
  members: (orgId: string) => ["orgs", orgId, "members"] as const,
  invites: (orgId: string) => ["orgs", orgId, "invites"] as const,

  sources: (orgId: string) => scoped<object>(orgId, "sources"),
  snapshots: (orgId: string, sourceId: string) => ["orgs", orgId, "sources", "detail", sourceId, "snapshots"] as const,
  snapshot: (orgId: string, sourceId: string, snapshotId: string) =>
    ["orgs", orgId, "sources", "detail", sourceId, "snapshots", snapshotId] as const,
  diffs: (orgId: string, sourceId: string) => ["orgs", orgId, "sources", "detail", sourceId, "diffs"] as const,

  changes: (orgId: string) => scoped<object>(orgId, "changes"),
  findings: (orgId: string) => scoped<object>(orgId, "findings"),
  notifications: (orgId: string) => scoped<object>(orgId, "notifications"),

  installations: (orgId: string) => ["orgs", orgId, "github", "installations"] as const,
  installUrl: (orgId: string) => ["orgs", orgId, "github", "install-url"] as const,
  availableRepos: (orgId: string, installationId: string) =>
    ["orgs", orgId, "github", "installations", installationId, "repositories"] as const,

  repositories: (orgId: string) => scoped<object>(orgId, "repositories"),
  scans: (orgId: string, repoId: string) => ["orgs", orgId, "repositories", "detail", repoId, "scans"] as const,
  integrations: (orgId: string) => scoped<object>(orgId, "integrations"),
  repairs: (orgId: string) => scoped<object>(orgId, "repairs"),
  pullRequests: (orgId: string) => scoped<object>(orgId, "pull-requests"),
  jobs: (orgId: string) => scoped<object>(orgId, "jobs"),
  audit: (orgId: string) => scoped<object>(orgId, "audit"),

  plans: (currency?: string) => ["billing", "plans", currency ?? "all"] as const,
  orgPlans: (orgId: string, currency?: string) => ["orgs", orgId, "billing", "plans", currency ?? "all"] as const,
  subscription: (orgId: string) => ["orgs", orgId, "billing", "subscription"] as const,
  usage: (orgId: string) => ["orgs", orgId, "billing", "usage"] as const,
  payments: (orgId: string, page?: number) => ["orgs", orgId, "billing", "payments", page ?? 1] as const,
  checkout: (orgId: string, checkoutId: string) => ["orgs", orgId, "billing", "checkout", checkoutId] as const,
  billing: (orgId: string) => ["orgs", orgId, "billing"] as const,
};
