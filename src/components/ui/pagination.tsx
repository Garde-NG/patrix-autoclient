"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/lib/api/types";
import { formatNumber } from "@/lib/utils";
import { Button } from "./button";

export function Pagination({ meta, onPage, isFetching }: { meta: PaginationMeta | undefined; onPage: (page: number) => void; isFetching?: boolean }) {
  if (!meta || meta.total_pages <= 1) return null;
  const start = (meta.page - 1) * meta.page_size + 1;
  const end = Math.min(meta.page * meta.page_size, meta.total_items);
  return (
    <nav className="flex items-center justify-between gap-3 pt-3" aria-label="Pagination">
      <p className="t-footnote tabular-nums text-text-2">
        {formatNumber(start)}–{formatNumber(end)} of {formatNumber(meta.total_items)}
        {isFetching ? <span className="ml-2 text-text-3">Updating…</span> : null}
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="secondary" size="sm" onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="t-footnote tabular-nums px-1 text-text-2">
          {meta.page} / {meta.total_pages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPage(meta.page + 1)} disabled={meta.page >= meta.total_pages} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
