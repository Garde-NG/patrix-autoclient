"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { KeyValue, ListGroup } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EvidenceList } from "@/components/shared/evidence";
import { messageOf } from "@/lib/api/client";
import { useIntegration } from "@/lib/api/hooks/integrations";
import type { Integration } from "@/lib/api/types";
import { formatDateTime, humanize } from "@/lib/utils";

function confidenceTone(confidence: Integration["confidence"]) {
  return confidence === "high" ? "success" : confidence === "medium" ? "warning" : "neutral";
}

/**
 * One detected integration. Three lines of text that each truncate on their own (name, package,
 * detection facts), the repository as a fourth line when the list spans repositories, and the
 * badges stacked on the trailing edge so they never squeeze the text on a phone.
 */
export function IntegrationRow({ integration: i, onClick, repoName }: { integration: Integration; onClick: () => void; repoName?: string | null }) {
  const version = i.resolved_version ?? i.version_spec;
  return (
    <button type="button" onClick={onClick} className="pressable-row flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-2 sm:items-center">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-purple-soft text-purple sm:mt-0">
        <Package className="size-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[15px] font-medium text-text">{i.provider_key}</span>
          {i.package_name ? <span className="t-mono hidden min-w-0 truncate text-text-2 md:inline">{i.package_name}</span> : null}
        </span>
        {i.package_name ? <span className="t-mono block truncate text-text-2 md:hidden">{i.package_name}</span> : null}
        <span className="t-footnote block truncate text-text-2">
          {i.ecosystem}
          {version ? ` · ${version}` : ""} · {humanize(i.detection_method)}
        </span>
        {repoName ? <span className="t-caption block truncate text-text-3">{repoName}</span> : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <Badge tone={confidenceTone(i.confidence)}>{humanize(i.confidence)}</Badge>
        {i.status !== "active" ? <StatusBadge status={i.status} /> : null}
      </span>
    </button>
  );
}

export function IntegrationSheet({ orgId, integrationId, onClose }: { orgId: string; integrationId: string | null; onClose: () => void }) {
  const q = useIntegration(orgId, integrationId);
  const i = q.data;
  return (
    <Sheet open={!!integrationId} onClose={onClose} size="lg" title={i ? i.provider_key : "Integration"} description={i ? `${i.package_name ?? "No package"} · ${i.ecosystem}` : undefined}>
      {q.isPending ? (
        <Skeleton className="h-64" />
      ) : q.isError || !i ? (
        <ErrorState message={messageOf(q.error)} />
      ) : (
        <div className="space-y-5 pb-2">
          <ListGroup>
            <dl className="divide-y divide-separator">
              <KeyValue label="Confidence" value={<Badge tone={confidenceTone(i.confidence)}>{humanize(i.confidence)}</Badge>} />
              <KeyValue label="Detected by" value={humanize(i.detection_method)} />
              <KeyValue label="Version" value={i.resolved_version ?? i.version_spec ?? "—"} mono />
              <KeyValue label="Status" value={<StatusBadge status={i.status} />} />
              <KeyValue
                label="API source"
                value={
                  i.api_source_id ? (
                    <Link href={`/o/${orgId}/sources/${i.api_source_id}`} className="text-accent hover:underline" onClick={onClose}>
                      Monitored
                    </Link>
                  ) : (
                    <span className="text-text-2">Not linked</span>
                  )
                }
              />
              <KeyValue
                label="Repository"
                value={
                  <Link href={`/o/${orgId}/repositories/${i.repository_id}`} className="text-accent hover:underline" onClick={onClose}>
                    Open
                  </Link>
                }
              />
              <KeyValue label="First seen" value={formatDateTime(i.first_seen_at)} />
              <KeyValue label="Last seen" value={formatDateTime(i.last_seen_at)} />
            </dl>
          </ListGroup>
          <div>
            <h3 className="t-headline mb-2 text-text">Evidence</h3>
            <div className="card overflow-hidden">
              <EvidenceList items={i.evidence} />
            </div>
          </div>
          <div>
            <h3 className="t-headline mb-1 text-text">Code references</h3>
            <p className="t-footnote mb-2 text-text-2">Used by impact analysis to decide whether an API change touches this repository.</p>
            <div className="card overflow-hidden">
              <EvidenceList items={i.code_references} emptyLabel="No code references recorded (manifest-only detection)." />
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
