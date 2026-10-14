"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `onSettled` exactly once each time `live` flips from true to false, i.e. when a polled
 * record finishes. Side effects must never live inside TanStack's `refetchInterval` callback: that
 * callback is re-evaluated on every observer update, so an invalidation there re-renders the page,
 * which re-evaluates the callback, which invalidates again, without end.
 */
export function useOnSettled(live: boolean | undefined, onSettled: () => void) {
  const wasLive = useRef(false);
  const callback = useRef(onSettled);

  useEffect(() => {
    callback.current = onSettled;
  });

  useEffect(() => {
    if (live) {
      wasLive.current = true;
      return;
    }
    if (live === false && wasLive.current) {
      wasLive.current = false;
      callback.current();
    }
  }, [live]);
}
