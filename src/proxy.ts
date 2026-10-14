import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/shared";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

/**
 * Fast, cookie-presence-only routing. Real validation (signature, expiry, refresh) happens in the
 * server layouts; this just keeps unauthenticated visitors off the app shell without a flash.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession =
    request.cookies.has(SESSION_COOKIE) || request.cookies.getAll().some((c) => c.name.startsWith(`${SESSION_COOKIE}.`));

  if (PUBLIC_PATHS.has(pathname)) {
    if (hasSession) return NextResponse.redirect(new URL("/orgs?auto=1", request.url));
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon_manfest|images|opengraph-image|twitter-image|icon.*|apple-icon.*|manifest.webmanifest|.*\.(?:png|svg|jpg|jpeg|webp|ico|webmanifest)$).*)",
  ],
};
