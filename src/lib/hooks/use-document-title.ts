"use client";

import { useEffect } from "react";

/** Once a record loads, put its real name in the tab title (the route metadata gives the generic one). */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · AutoAPI`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
