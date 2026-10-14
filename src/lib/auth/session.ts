import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readAuthToken, writeAuthToken } from "./cookie";
import { refreshToken } from "./refresh";
import { isAuthenticated, shouldRefresh, type AppToken } from "./shared";
import type { User } from "./types";

/**
 * The current token, refreshed if it is about to expire. Route handlers can persist the
 * rotated token; server components cannot set cookies, so they only read.
 */
export async function getValidToken(options: { persist: boolean }): Promise<AppToken | null> {
  const token = await readAuthToken();
  if (!token || !isAuthenticated(token)) return token;
  if (!shouldRefresh(token)) return token;
  const refreshed = await refreshToken(token);
  if (options.persist && refreshed.authError !== "ServiceUnavailable") {
    await writeAuthToken(refreshed).catch(() => undefined);
  }
  return refreshed;
}

/**
 * Server-component guard. A dead session goes through /api/auth/expired, which can clear the
 * cookie before showing sign-in; redirecting to /login directly would loop, because the proxy
 * sends any request that still carries a session cookie back into the app.
 */
export const requireUser = cache(async (): Promise<User> => {
  const token = await getValidToken({ persist: false });
  if (!token || !isAuthenticated(token)) redirect("/api/auth/expired");
  return token.user;
});

export const currentUser = cache(async (): Promise<User | null> => {
  const token = await getValidToken({ persist: false });
  return token && isAuthenticated(token) ? token.user : null;
});
