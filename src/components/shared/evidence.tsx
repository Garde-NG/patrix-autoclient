import { FileCode2, HelpCircle } from "lucide-react";
import type { FindingEvidence } from "@/lib/api/types";
import { Code } from "@/components/ui/page";

export function EvidenceList({ items, emptyLabel = "No code evidence recorded." }: { items: FindingEvidence[]; emptyLabel?: string }) {
  if (!items?.length) return <p className="t-footnote px-4 py-3 text-text-2">{emptyLabel}</p>;
  return (
    <ul className="divide-y divide-separator">
      {items.map((e, i) => {
        const file = typeof e.file === "string" ? e.file : typeof e.path === "string" ? (e.path as string) : null;
        const line = typeof e.line === "number" ? e.line : null;
        const snippet = typeof e.snippet === "string" ? e.snippet : typeof e.text === "string" ? (e.text as string) : null;
        const kind = typeof e.kind === "string" ? e.kind : typeof e.type === "string" ? (e.type as string) : null;
        return (
          <li key={i} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4 shrink-0 text-text-2" aria-hidden />
              <span className="t-mono min-w-0 truncate text-text">
                {file ?? "—"}
                {line !== null ? <span className="text-text-2">:{line}</span> : null}
              </span>
              {kind ? <span className="t-caption ml-auto shrink-0 rounded-full bg-fill px-2 py-0.5 text-text-2">{kind}</span> : null}
            </div>
            {snippet ? (
              <Code block className="mt-2 max-h-40 p-3">
                {snippet}
              </Code>
            ) : null}
            {!file && !snippet ? (
              <Code block className="mt-2 max-h-40 p-3">
                {JSON.stringify(e, null, 2)}
              </Code>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function UnknownsList({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="divide-y divide-separator">
      {items.map((u, i) => (
        <li key={i} className="flex gap-2.5 px-4 py-3">
          <HelpCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <span className="t-body text-text">{u}</span>
        </li>
      ))}
    </ul>
  );
}
