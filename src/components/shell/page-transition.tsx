"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/**
 * Pages arrive with a short, critically damped rise. Keyed on the pathname so every navigation
 * gets it; no exit animation, so navigation is never delayed and the new page is interactive
 * immediately. Reduced motion keeps only the fade.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.38 }}
      className="min-w-0"
    >
      {children}
    </motion.div>
  );
}

/** Crossfade between loading, empty and loaded content without layout jumps. */
export function Reveal({ children, id }: { children: ReactNode; id: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div key={id} initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} className="min-w-0">
      {children}
    </motion.div>
  );
}
