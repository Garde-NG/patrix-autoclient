import "server-only";
import { createHash } from "node:crypto";
import { upstream, UpstreamError } from "@/lib/server/upstream";
import type { Tokens, TokenResponse } from "./types";
import type { AppToken } from "./shared";

/** Concurrent requests near expiry share one refresh so the rotated token is not burned twice. */
const inflight = new Map<string, Promise<Tokens>>();

export async function refreshToken(token: AppToken): Promise<AppToken> {
  if (!token.tokens) return { ...token, authError: "SessionExpired" };
  const key = createHash("sha256").update(token.tokens.refresh_token).digest("hex");
  let request = inflight.get(key);
  if (!request) {
    request = upstream<Tokens>("auth/refresh", { body: { refresh_token: token.tokens.refresh_token } });
    inflight.set(key, request);
    setTimeout(() => inflight.delete(key), 15_000).unref();
  }
  try {
    const tokens = await request;
    return { ...token, tokens, expiresAt: Date.now() + tokens.expires_in * 1000, authError: undefined };
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 401) {
      return { sub: token.sub, authError: "SessionExpired" };
    }
    return { ...token, authError: "ServiceUnavailable" };
  }
}

export function tokenFromLogin(result: TokenResponse): AppToken {
  if (!result.access_token || !result.refresh_token || !result.user) {
    throw new UpstreamError(502, "The sign-in response was incomplete.");
  }
  return {
    sub: result.user.id,
    user: result.user,
    tokens: {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
    },
    expiresAt: Date.now() + result.expires_in * 1000,
  };
}
