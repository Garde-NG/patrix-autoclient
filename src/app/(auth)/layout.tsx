import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(60%_60%_at_50%_0%,var(--accent-soft),transparent_70%)]"
      />
      <header className="relative flex h-16 items-center px-5 sm:px-8">
        <Link href="/" className="pressable rounded-lg">
          <Wordmark />
        </Link>
      </header>
      <main className="relative flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">{children}</main>
      <footer className="relative px-5 py-6 text-center">
        <p className="t-caption text-text-3">AutoAPI watches the APIs your code depends on and proposes verified fixes. It never merges.</p>
      </footer>
    </div>
  );
}
