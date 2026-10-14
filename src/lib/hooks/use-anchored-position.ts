"use client";

import { useCallback, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export interface AnchoredOptions {
  /** Which edge of the anchor the popover's edge lines up with. */
  align?: "start" | "end";
  /** Gap between anchor and popover, px. */
  offset?: number;
  minWidth?: number;
  /** Match the anchor's width (pop-up buttons) or size to content (menus). */
  matchWidth?: boolean;
  /** Upper bound for the popover height; the hook shrinks it further to fit the screen. */
  maxHeight?: number;
  /** Screen edge inset, px. */
  inset?: number;
}

export interface AnchoredPosition {
  style: CSSProperties;
  placement: "above" | "below";
  maxHeight: number;
  /** Transform origin for a scale-in from the anchor. */
  originX: number;
  originY: number;
}

/**
 * Positions a `position: fixed` popover next to its anchor and keeps it on screen:
 * flips above when there is more room there, clamps horizontally to the viewport, shrinks
 * the max height to the space available, and follows the anchor while anything scrolls or
 * the window resizes. Never closes on scroll; that is the caller's decision.
 */
export function useAnchoredPosition(anchorRef: RefObject<HTMLElement | null>, open: boolean, options: AnchoredOptions = {}): AnchoredPosition | null {
  const { align = "start", offset = 8, minWidth = 200, matchWidth = false, maxHeight = 360, inset = 8 } = options;
  const [pos, setPos] = useState<AnchoredPosition | null>(null);

  const compute = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(matchWidth ? Math.max(r.width, minWidth) : minWidth, vw - inset * 2);
    const below = vh - r.bottom - offset - inset;
    const above = r.top - offset - inset;
    const placement: "above" | "below" = below >= Math.min(maxHeight, 160) || below >= above ? "below" : "above";
    const available = placement === "below" ? below : above;
    const height = Math.max(120, Math.min(maxHeight, available));
    let left = align === "end" ? r.right - width : r.left;
    left = Math.max(inset, Math.min(left, vw - inset - width));
    const style: CSSProperties =
      placement === "below"
        ? { position: "fixed", top: r.bottom + offset, left, width: matchWidth ? width : undefined, minWidth: width, maxHeight: height }
        : { position: "fixed", bottom: vh - r.top + offset, left, width: matchWidth ? width : undefined, minWidth: width, maxHeight: height };
    const anchorCenter = r.left + r.width / 2;
    setPos({ style, placement, maxHeight: height, originX: Math.max(0, Math.min(1, (anchorCenter - left) / width)), originY: placement === "below" ? 0 : 1 });
  }, [anchorRef, align, offset, minWidth, matchWidth, maxHeight, inset]);

  useLayoutEffect(() => {
    if (!open) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    };
    // First measurement right after layout (a microtask, so it is not throttled like rAF in a
    // background tab); scroll and resize updates coalesce on animation frames.
    let cancelled = false;
    queueMicrotask(() => !cancelled && compute());
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, [open, compute]);

  return open ? pos : null;
}

/** True below the `sm` breakpoint; popovers become sheets there. */
export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(false);
  useLayoutEffect(() => {
    const mq = matchMedia("(max-width: 639px)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return phone;
}
