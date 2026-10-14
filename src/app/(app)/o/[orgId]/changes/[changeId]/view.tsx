"use client";

import { use } from "react";
import Link from "next/link";
import { useOrgContext } from "@/components/shell/org-provider";
import { useDocumentTitle } from "@/lib/hooks/use-document-title";
import { Badge, SeverityBadge } from "@/components/ui/badge";
import { Card, KeyValue, ListGroup } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Code, PageHeader, Section } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Operation } from "@/components/shared/operation";
import { messageOf } from "@/lib/api/client";
import { useChange } from "@/lib/api/hooks/changes";
import { useFindings } from "@/lib/api/hooks/findings";
import { useSource } from "@/lib/api/hooks/sources";
import { formatDateTime, humanize } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";

export default function ChangePage({ params }: { params: Promise<{ changeId: string }> }) {
  const { changeId } = use(params);
  const { orgId } = useOrgContext();
  const change = useChange(orgId, changeId);
  const c = change.data;
  useDocumentTitle(c?.summary);
  const source = useSource(orgId, c?.api_source_id ?? "");
  const findings = useFindings(orgId, { page_size: 50, include_dismissed: true });
  const related = findings.data?.items.filter((f) => f.api_change_id === changeId) ?? [];

  if (change.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 rounded-[18px]" />
      </div>
    );
  }
  if (change.isError || !c) return <ErrorState message={messageOf(change.error)} onRetry={() => change.refetch()} />;

  return (
    <>
      <PageHeader
        back={{ href: `/o/${orgId}/changes`, label: "API changes" }}
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <SeverityBadge severity={c.severity} />
            <Badge>{humanize(c.category)}</Badge>
          </span>
        }
        title={c.summary}
        description={<Operation method={c.operation_method} path={c.operation_path} className="text-[14px]" />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {c.comment ? (
            <Card className="p-5">
              <h2 className="t-headline mb-1.5 text-text">oasdiff comment</h2>
              <p className="t-body whitespace-pre-wrap text-text">{c.comment}</p>
            </Card>
          ) : null}

          <Section title="Evidence" description="The raw oasdiff entry, kept verbatim so the classification can be audited.">
            <Code block>{JSON.stringify(c.evidence, null, 2)}</Code>
          </Section>

          {c.location ? (
            <Section title="Location in the document">
              <Code block>{JSON.stringify(c.location, null, 2)}</Code>
            </Section>
          ) : null}

          <Section title="Findings raised by this change">
            {related.length ? (
              <ListGroup>
                {related.map((f) => (
                  <Link key={f.id} href={`/o/${orgId}/findings/${f.id}`} className="pressable-row flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-text">{f.title}</span>
                      <span className="t-caption text-text-2">{f.repository_id ? "Repository-level" : "Source-level"}</span>
                    </span>
                    <StatusBadge status={f.status} />
                  </Link>
                ))}
              </ListGroup>
            ) : (
              <p className="t-footnote px-1 text-text-2">{findings.isPending ? "Loading…" : "No findings reference this change."}</p>
            )}
          </Section>
        </div>

        <div>
          <ListGroup>
            <dl className="divide-y divide-separator">
              <KeyValue
                label="Source"
                value={
                  <Link href={`/o/${orgId}/sources/${c.api_source_id}`} className="text-accent hover:underline">
                    {source.data?.name ?? "View"}
                  </Link>
                }
              />
              <KeyValue label="Rule" value={c.rule_id} mono />
              <KeyValue label="Section" value={c.section} />
              <KeyValue label="oasdiff level" value={c.oasdiff_level} />
              <KeyValue label="Inferred by" value={c.inferred_by} />
              <KeyValue label="Occurrences" value={c.occurrences} />
              {c.operation_id ? <KeyValue label="Operation id" value={c.operation_id} mono /> : null}
              <KeyValue label="First seen" value={formatDateTime(c.created_at)} />
              <KeyValue label="Last seen" value={formatDateTime(c.updated_at)} />
              <KeyValue
                label="Diff run"
                value={
                  <Link href={`/o/${orgId}/changes?diff_id=${c.spec_diff_id}`} className="text-accent hover:underline">
                    All changes in this run
                  </Link>
                }
              />
            </dl>
          </ListGroup>
        </div>
      </div>
    </>
  );
}
