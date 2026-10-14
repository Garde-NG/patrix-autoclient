"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Primitive = string | number | boolean | undefined;

/**
 * Filters and page number live in the URL, so lists are shareable and the back button works.
 * Changing a filter resets to page 1.
 */
export function useListParams<T extends Record<string, Primitive>>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const params = useMemo(() => {
    const out: Record<string, Primitive> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const raw = search.get(key);
      if (raw === null) continue;
      const d = defaults[key];
      out[key] = typeof d === "number" ? Number(raw) || d : typeof d === "boolean" ? raw === "true" : raw;
    }
    const page = Number(search.get("page") ?? 1);
    return { ...(out as T), page: Number.isFinite(page) && page > 0 ? page : 1 };
  }, [search, defaults]);

  const update = useCallback(
    (patch: Partial<T & { page: number }>) => {
      const next = new URLSearchParams(search.toString());
      const merged = { ...params, ...patch };
      if (!("page" in patch)) (merged as Record<string, Primitive>).page = 1;
      for (const [k, v] of Object.entries(merged)) {
        const d = k === "page" ? 1 : defaults[k];
        if (v === undefined || v === "" || v === d) next.delete(k);
        else next.set(k, String(v));
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [search, params, defaults, pathname, router],
  );

  return { params, update, setPage: (page: number) => update({ page } as Partial<T & { page: number }>) };
}
