import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/session";
import { UserProvider } from "@/components/shell/user-provider";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <UserProvider user={user}>{children}</UserProvider>;
}
