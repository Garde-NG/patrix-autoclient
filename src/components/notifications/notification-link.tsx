import type { Notification } from "@/lib/api/types";

/** Where a notification should take the user, derived from the ids the API attaches. */
export function notificationHref(orgId: string, n: Notification): string {
  const d = n.data ?? {};
  const str = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : null);
  if (str("finding_id")) return `/o/${orgId}/findings/${str("finding_id")}`;
  if (str("repair_job_id")) return `/o/${orgId}/repairs/${str("repair_job_id")}`;
  if (str("pull_request_id")) return `/o/${orgId}/pull-requests/${str("pull_request_id")}`;
  if (str("repository_id")) return `/o/${orgId}/repositories/${str("repository_id")}`;
  if (str("api_source_id") || str("source_id")) return `/o/${orgId}/sources/${str("api_source_id") ?? str("source_id")}`;
  if (str("api_change_id")) return `/o/${orgId}/changes/${str("api_change_id")}`;
  if (n.type.startsWith("billing")) return `/o/${orgId}/billing`;
  return `/o/${orgId}/notifications`;
}
