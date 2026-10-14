import type { JWT } from "next-auth/jwt";
import type { Tokens, User } from "./types";

export const SESSION_COOKIE = "autoapi.session";
/** Matches the upstream refresh-token lifetime (30 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
/** Refresh the access token when it has less than this long to live. */
export const REFRESH_SKEW_MS = 60_000;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function authSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Set NEXTAUTH_SECRET to at least 32 random characters.");
  }
  return secret;
}

export type AuthError = "SessionExpired" | "ServiceUnavailable";

/** What lives inside the encrypted NextAuth cookie. Never exposed to the browser. */
export interface AppToken extends JWT {
  user?: User;
  tokens?: Tokens;
  /** Epoch ms when the access token expires. */
  expiresAt?: number;
  authError?: AuthError;
}

export function isAuthenticated(token: AppToken | null | undefined): token is AppToken & {
  user: User;
  tokens: Tokens;
  expiresAt: number;
} {
  return !!token && !!token.user && !!token.tokens && token.authError !== "SessionExpired";
}

export function shouldRefresh(token: AppToken): boolean {
  return isAuthenticated(token) && (token.expiresAt ?? 0) < Date.now() + REFRESH_SKEW_MS;
}
