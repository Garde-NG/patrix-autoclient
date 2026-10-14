/* Browser-side transport. Every call goes to the same-origin gateway, never to the API directly. */

export interface FieldError {
  field: string | null;
  message: string;
}

export class ApiError extends Error {
  readonly fields: Record<string, string>;
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: FieldError[] = [],
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.fields = Object.fromEntries(errors.filter((e) => e.field).map((e) => [e.field as string, e.message]));
  }
  get isSessionExpired() {
    return this.status === 401 && this.code === "session_expired";
  }
  get isPlanLimit() {
    return this.status === 402;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

let redirectingToLogin = false;

function toSearch(query?: Record<string, QueryValue>): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function request<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, options: RequestOptions = {}): Promise<T> {
  const url = `/api/proxy/${path.replace(/^\//, "")}${toSearch(options.query)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: options.body === undefined ? {} : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(0, "You appear to be offline. Check your connection and try again.");
  }
  if (response.status === 204) return undefined as T;
  const result = (await response.json().catch(() => null)) as
    | { success?: boolean; message?: string; data?: T; errors?: FieldError[]; code?: string }
    | null;
  if (!response.ok || !result?.success) {
    const error = new ApiError(
      response.status,
      result?.message ?? "Something went wrong. Please try again.",
      Array.isArray(result?.errors) ? result.errors : [],
      result?.code,
    );
    if (error.isSessionExpired && typeof window !== "undefined" && !redirectingToLogin) {
      redirectingToLogin = true;
      const next = `${window.location.pathname}${window.location.search}`;
      // Hard navigation on purpose: it drops every in-memory cache along with the dead session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?reason=expired&next=${encodeURIComponent(next)}`);
    }
    throw error;
  }
  return result.data as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) => request<T>("GET", path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Record<string, QueryValue>) => request<T>("POST", path, { body, query }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
};

export function messageOf(error: unknown, fallback = "Something went wrong. Please try again."): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
