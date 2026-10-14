import type { ReactNode } from "react";
import { motion } from "motion/react";

export function AuthPanel({ title, description, children, footer }: { title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      className="w-full max-w-[420px]"
    >
      <div className="card p-6 sm:p-8">
        <h1 className="t-title text-text">{title}</h1>
        {description ? <p className="t-body mt-1.5 text-text-2">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <p className="t-footnote mt-5 text-center text-text-2">{footer}</p> : null}
    </motion.div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">
      {message}
    </div>
  );
}
