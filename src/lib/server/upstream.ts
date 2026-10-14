import "server-only";

export interface FieldError {
  field: string | null;
  message: string;
}

/** A failure talking to the AutoAPI API, carrying the upstream status and message verbatim. */
export class UpstreamError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: FieldError[] = [],
    public retryAfter?: string,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

export interface Envelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: FieldError[];
}

export function apiBaseUrl(): string {
  const base = process.env.AUTOAPI_API_URL;
  if (!base) throw new UpstreamError(503, "The API is not configured on this server.");
  return base.replace(/\/$/, "");
}

interface RawOptions {
  method?: string;
  body?: BodyInit | null;
  contentType?: string | null;
  accessToken?: string;
  search?: string;
  requestId?: string | null;
  timeoutMs?: number;
}

/**
 * Low-level transport used by the gateway. Returns the raw response so callers can pass
 * status and body straight through. Never logs tokens or bodies.
 */
export async function upstreamRaw(path: string, options: RawOptions = {}): Promise<Response> {
  const url = `${apiBaseUrl()}/${path.replace(/^\//, "")}${options.search ?? ""}`;
  const headers = new Headers({ Accept: "application/json" });
  if (options.contentType) headers.set("Content-Type", options.contentType);
  if (options.accessToken) headers.set("Authorization", `Bearer ${options.accessToken}`);
  if (options.requestId) headers.set("X-Request-ID", options.requestId);
  try {
    return await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ?? undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
    });
  } catch {
    throw new UpstreamError(503, "The API is unreachable right now. Please try again shortly.");
  }
}

/** Typed JSON call that unwraps the `{success, message, data}` envelope. */
export async function upstream<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; accessToken?: string } = {},
): Promise<T> {
  const response = await upstreamRaw(path, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    body: init.body === undefined ? null : JSON.stringify(init.body),
    contentType: init.body === undefined ? null : "application/json",
    accessToken: init.accessToken,
  });
  if (response.status === 204) return undefined as T;
  const result = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !result?.success) {
    throw new UpstreamError(
      response.ok ? 502 : response.status,
      typeof result?.message === "string" ? result.message : "The API request failed.",
      Array.isArray(result?.errors) ? result.errors : [],
      response.headers.get("retry-after") ?? undefined,
    );
  }
  return result.data as T;
}
