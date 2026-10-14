import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth/cookie";
import { safeReturnPath } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Ends a dead session and lands on the sign-in page. Server components cannot write cookies, so
 * when a layout finds an expired or revoked token it sends the browser here instead of straight
 * to /login: with the stale cookie still set, /login would bounce back into the app and the two
 * redirects would chase each other forever.
 */
export async function GET(request: NextRequest) {
  await clearAuthCookie().catch(() => undefined);
  const login = new URL("/login", request.url);
  login.searchParams.set("reason", request.nextUrl.searchParams.get("reason") ?? "expired");
  const next = request.nextUrl.searchParams.get("next");
  if (next) login.searchParams.set("next", safeReturnPath(next));
  return NextResponse.redirect(login, { headers: { "Cache-Control": "no-store" } });
}
