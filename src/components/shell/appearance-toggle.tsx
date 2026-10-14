"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Appearance follows the system until a person flips the switch; the choice is remembered on this
 * device. "Follow system" clears it. The root <script> in layout.tsx applies the same rule before
 * first paint so there is never a flash.
 */
const KEY = "autoapi.theme";
const EVENT = "autoapi:theme";

type Stored = "light" | "dark" | null;

function stored(): Stored {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}
function systemDark() {
  return typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
}
let transitionTimer: number | undefined;
function apply() {
  const dark = stored() ? stored() === "dark" : systemDark();
  const root = document.documentElement;
  if (root.classList.contains("dark") !== dark) {
    // Ease every colour for a moment so the switch feels like a dimmer, not a cut.
    root.classList.add("theme-transition");
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => root.classList.remove("theme-transition"), 260);
  }
  root.classList.toggle("dark", dark);
}
function subscribe(cb: () => void) {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    apply();
    cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onSystem);
  mq.addEventListener("change", onSystem);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onSystem);
    mq.removeEventListener("change", onSystem);
  };
}
/** Snapshot: "dark" | "light" currently in effect, plus whether that came from the system. */
function snapshot() {
  const s = stored();
  return `${s ? s : systemDark() ? "dark" : "light"}:${s ? "manual" : "system"}`;
}

export function useAppearance() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => "light:system");
  const [mode, source] = snap.split(":") as ["light" | "dark", "manual" | "system"];
  const setDark = useCallback((dark: boolean) => {
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {}
    apply();
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const followSystem = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    apply();
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { isDark: mode === "dark", followsSystem: source === "system", setDark, followSystem };
}

/** iOS-style switch whose knob carries a sun or moon. */
export function AppearanceSwitch({ className }: { className?: string }) {
  const { isDark, setDark } = useAppearance();
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Dark mode on" : "Dark mode off"}
      onClick={() => setDark(!isDark)}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]",
        isDark ? "bg-accent" : "bg-fill-strong",
        className,
      )}
    >
      <motion.span
        layout
        transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.15, duration: 0.35 }}
        className={cn("absolute top-[2px] flex size-[27px] items-center justify-center rounded-full bg-white text-[#1d1d1f] shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)]", isDark ? "left-[22px]" : "left-[2px]")}
      >
        {isDark ? <Moon className="size-[15px]" strokeWidth={2.2} /> : <Sun className="size-[15px]" strokeWidth={2.2} />}
      </motion.span>
    </button>
  );
}

/** Compact circular toggle for toolbars: tap to flip, with a short crossfade between icons. */
export function AppearanceButton({ className }: { className?: string }) {
  const { isDark, setDark } = useAppearance();
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={() => setDark(!isDark)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      whileTap={reduce ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", bounce: 0, duration: 0.22 }}
      className={cn("relative flex size-11 items-center justify-center rounded-full text-text-2 hover:bg-fill hover:text-text focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]", className)}
    >
      <motion.span key={isDark ? "moon" : "sun"} initial={reduce ? false : { opacity: 0, rotate: -40, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} className="flex">
        {isDark ? <Moon className="size-[19px]" strokeWidth={1.9} /> : <Sun className="size-[19px]" strokeWidth={1.9} />}
      </motion.span>
    </motion.button>
  );
}

/** Settings-style row: label and description with the switch trailing, plus "follow system". */
export function AppearanceRow({ className, children }: { className?: string; children?: ReactNode }) {
  const { isDark, followsSystem, followSystem } = useAppearance();
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        <p className="t-body font-medium text-text">Dark Mode</p>
        <p className="t-footnote text-text-2">
          {followsSystem ? `Following your device (${isDark ? "dark" : "light"})` : "Set on this device."}
          {!followsSystem ? (
            <>
              {" "}
              <button type="button" onClick={followSystem} className="font-medium text-accent hover:underline">
                Follow system
              </button>
            </>
          ) : null}
        </p>
        {children}
      </div>
      <AppearanceSwitch />
    </div>
  );
}
