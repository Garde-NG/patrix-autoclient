import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/cookie";
import { getValidToken } from "@/lib/auth/session";
import { isAuthenticated } from "@/lib/auth/shared";
import { upstreamRaw, UpstreamError } from "@/lib/server/upstream";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 12 * 1024 * 1024; // OpenAPI uploads are capped upstream at 10MB
const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

/** Token-issuing endpoints go through NextAuth only; the gateway must never mint sessions. */
const BLOCKED = new Set(["auth/login", "auth/signup", "auth/refresh", "auth/logout"]);
/** Readable without a session. */
const PUBLIC = new Set(["billing/plans"]);

function fail(status: number, message: string, extra: Record<string, unknown> = {}, headers: HeadersInit = {}) {
  return NextResponse.json({ success: false, message, errors: [], ...extra }, { status, headers: { ...NO_STORE, ...headers } });
}

function sameOrigin(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set([request.nextUrl.origin, process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL].filter(Boolean));
  return allowed.has(origin);
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const requestId = request.headers.get("x-request-id");
  try {
    const { path: segments } = await context.params;
    const path = segments.map((s) => encodeURIComponent(decodeURIComponent(s))).join("/");
    if (!ALLOWED_METHODS.has(request.method)) return fail(405, "Method not allowed.");
    if (BLOCKED.has(path) || path.startsWith("webhooks/")) return fail(404, "Not found.");
    if (request.method !== "GET" && !sameOrigin(request)) return fail(403, "Cross-site requests are not allowed.");

    let accessToken: string | undefined;
    if (!PUBLIC.has(path)) {
      const token = await getValidToken({ persist: true });
      if (!token || !isAuthenticated(token)) {
        await clearAuthCookie().catch(() => undefined);
        return fail(401, "Your session has expired. Please sign in again.", { code: "session_expired" });
      }
      if (token.authError === "ServiceUnavailable") {
        return fail(503, "The API is unreachable right now. Please try again shortly.");
      }
      accessToken = token.tokens.access_token;
    }

    let body: string | null = null;
    let contentType: string | null = null;
    if (request.method !== "GET") {
      const declared = Number(request.headers.get("content-length") ?? 0);
      if (declared > MAX_BODY_BYTES) return fail(413, "The request body is too large.");
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) return fail(413, "The request body is too large.");
      if (raw) {
        contentType = "application/json";
        try {
          JSON.parse(raw);
        } catch {
          return fail(400, "The request body must be JSON.");
        }
        body = raw;
      }
    }

    const response = await upstreamRaw(path, {
      method: request.method,
      body,
      contentType,
      accessToken,
      search: request.nextUrl.search,
      requestId,
    });

    // The upstream rejected the bearer token itself (revoked, rotated elsewhere, or from another
    // environment): the session is dead, so end it here instead of surfacing a confusing API error.
    if (response.status === 401 && accessToken) {
      await clearAuthCookie().catch(() => undefined);
      return fail(401, "Your session has expired. Please sign in again.", { code: "session_expired" });
    }

    const headers = new Headers(NO_STORE);
    const upstreamId = response.headers.get("x-request-id");
    if (upstreamId) headers.set("X-Request-ID", upstreamId);
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) headers.set("Retry-After", retryAfter);

    if (response.status === 204) return new NextResponse(null, { status: 204, headers });
    const text = await response.text();
    headers.set("Content-Type", response.headers.get("content-type") ?? "application/json");
    return new NextResponse(text, { status: response.status, headers });
  } catch (error) {
    if (error instanceof UpstreamError) {
      return fail(error.status, error.message, { errors: error.errors }, error.retryAfter ? { "Retry-After": error.retryAfter } : {});
    }
    return fail(500, "Something went wrong. Please try again.");
  }
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
