"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@/lib/auth/types";
import { useMe } from "@/lib/api/hooks/account";

const Ctx = createContext<User | null>(null);

/** The signed-in user, seeded from the server session and kept fresh by TanStack. */
export function UserProvider({ user, children }: { user: User; children: ReactNode }) {
  const me = useMe(user);
  return <Ctx.Provider value={me.data ?? user}>{children}</Ctx.Provider>;
}

export function useUser(): User {
  const user = useContext(Ctx);
  if (!user) throw new Error("useUser must be used inside UserProvider");
  return user;
}
