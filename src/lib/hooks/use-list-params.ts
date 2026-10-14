"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/**
 * Text filters type into local state and sync to the URL after a short pause, so every
 * keystroke is captured and the page does not re-render per character. The URL still wins when
 * it changes from outside (back/forward, a pasted link).
 */
export function useDebouncedParam(value: string, commit: (next: string) => void, delay = 350) {
  const [local, setLocal] = useState(value);
  const [seen, setSeen] = useState(value);
  // What we last pushed to the URL: state for render-time comparison, a ref for the timer callback.
  const [committed, setCommitted] = useState(value);
  const lastCommitted = useRef(value);
  const timer = useRef<number | undefined>(undefined);

  // External URL change (not one we just committed): adopt it. Adjusting state during render
  // is the React-sanctioned way to derive from a changed prop without an effect.
  if (value !== seen) {
    setSeen(value);
    if (value !== committed) {
      setCommitted(value);
      setLocal(value);
    }
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onChange = useCallback(
    (next: string) => {
      setLocal(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (next === lastCommitted.current) return;
        lastCommitted.current = next;
        setCommitted(next);
        commit(next);
      }, delay);
    },
    [commit, delay],
  );

  return [local, onChange] as const;
}
