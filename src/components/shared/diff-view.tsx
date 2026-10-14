import { cn } from "@/lib/utils";

/** Minimal unified-diff renderer with Apple-style soft add/remove tints. */
export function DiffView({ patch, className }: { patch: string; className?: string }) {
  const lines = patch.split("\n");
  return (
    <pre className={cn("t-mono scroll-thin max-h-[560px] overflow-auto rounded-[12px] border border-separator bg-surface-2 text-[12.5px] leading-[1.55]", className)}>
      {lines.map((line, i) => {
        const cls = line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff ") || line.startsWith("index ")
          ? "diff-line-meta font-semibold"
          : line.startsWith("@@")
            ? "diff-line-meta"
            : line.startsWith("+")
              ? "diff-line-add"
              : line.startsWith("-")
                ? "diff-line-del"
                : "";
        return (
          <div key={i} className={cn("whitespace-pre px-4", cls)}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}
