"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { messageOf } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import { ErrorState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ListSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Handles the four list states once: loading, error, empty, data (+ pagination). */
export function ListShell<T>({
  query,
  empty,
  onPage,
  children,
  rows = 6,
  className,
}: {
  query: UseQueryResult<Paginated<T>>;
  empty: ReactNode;
  onPage: (page: number) => void;
  children: (items: T[]) => ReactNode;
  rows?: number;
  className?: string;
}) {
  if (query.isPending) return <ListSkeleton rows={rows} className={className} />;
  if (query.isError) return <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} className={className} />;
  if (!query.data.items.length) return <>{empty}</>;
  return (
    <div className={cn(query.isPlaceholderData && "opacity-60 transition-opacity", className)}>
      {children(query.data.items)}
      <Pagination meta={query.data.meta} onPage={onPage} isFetching={query.isFetching} />
    </div>
  );
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-3 flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("-mx-4 mb-3 overflow-x-auto px-4 scroll-thin sm:mx-0 sm:px-0", className)}>{children}</div>;
}
