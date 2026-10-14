# AutoAPI Client

Customer-facing web app for [AutoAPI](../garde-autoapi-api): monitor the third-party APIs your code depends on, see
breaking changes mapped to your repositories, and review verified AI repairs delivered as pull requests.

Next.js 16 (App Router) · TanStack Query 5 · NextAuth 4 · Tailwind 4 · Motion.

## Run

```bash
npm install
cp .env.example .env.local        # set NEXTAUTH_SECRET and AUTOAPI_API_URL
npm run dev                       # http://localhost:3000
```

Without the backend, run the mock API in a second terminal and sign in with any email and the password `password`:

```bash
npm run mock-api                  # http://localhost:8000/api/v1
```

`npm run typecheck` and `npm run lint` must both be clean before a commit.

## How it is put together

**Auth.** `src/lib/auth/options.ts` is a NextAuth credentials provider with two modes, `login` and `signup`, that call
the API and store the upstream access/refresh tokens inside the encrypted NextAuth JWT cookie. The browser never sees
them. The `jwt` callback refreshes the access token a minute before expiry; `src/lib/auth/refresh.ts` de-duplicates
concurrent refreshes so a rotated refresh token is never burned twice. `src/proxy.ts` (Next 16's middleware) does a
cookie-presence redirect; real validation happens in `src/lib/auth/session.ts` (`requireUser`) inside the server
layouts.

**Gateway.** Every API call from the browser goes to `/api/proxy/<path>`
(`src/app/api/proxy/[...path]/route.ts`), which attaches the bearer token, refreshes it if needed, enforces
same-origin on mutations, blocks token-issuing endpoints, and passes the upstream status and
`{success, message, data, errors}` envelope straight through. A dead session returns `401` with
`code: "session_expired"`, which the client turns into a redirect to `/login?reason=expired`.

**Data.** `src/lib/api/client.ts` is the fetch wrapper (`ApiError` carries status, field errors and plan-limit
detection). `src/lib/api/types.ts` mirrors the API schemas field for field. `src/lib/api/keys.ts` is the hierarchical
query-key factory, and `src/lib/api/hooks/*` holds one module per feature with queries, mutations, invalidation and
optimistic updates. The `QueryClient` in `src/lib/query/provider.tsx` sets a 30s `staleTime`, skips retries on 4xx,
and surfaces failures through the toast system. Live records (running scans, in-flight repairs, pending diffs and PRs)
poll while active and invalidate their dependents when they settle.

**Lists.** Filters and page live in the URL (`src/lib/hooks/use-list-params.ts`) so views are shareable and the back
button works. `src/components/shared/list-shell.tsx` renders the loading / error / empty / paginated states once.

**UI.** Design tokens for light and dark live in `src/app/globals.css` (Apple-style canvas, translucent materials,
size-specific tracking, reduced-motion and reduced-transparency fallbacks). Primitives are in `src/components/ui`:
no app-level appearance switch (the system setting is followed, per the HIG), spring-driven `Sheet` (bottom sheet on phones with velocity-projected dismiss, side panel on desktop), `ConfirmDialog`,
`Menu` anchored to its trigger, `Segmented` control, badges with a single status-to-tone mapping, toasts. The shell
(`src/components/shell`) is a sidebar on desktop and a translucent tab bar plus "More" sheet on phones.

## Routes

| Path | What |
| --- | --- |
| `/login`, `/signup`, `/invites/accept?token=` | Auth |
| `/orgs`, `/account` | Workspace picker, profile and password |
| `/o/[orgId]` | Overview: stats, latest findings, changes, repairs, plan usage |
| `/o/[orgId]/findings[/id]` | Findings with filters; acknowledge, dismiss, reopen, request repair |
| `/o/[orgId]/changes[/id]` | oasdiff changes with evidence |
| `/o/[orgId]/sources[/id]` | API sources; snapshots, diff runs, upload, fetch now, pause |
| `/o/[orgId]/repositories[/id]` | Connect from a GitHub installation; scans, integrations, findings |
| `/o/[orgId]/integrations` | Detected SDK inventory with evidence and code references |
| `/o/[orgId]/repairs[/id]` | Repair pipeline, attempts, patch, verification checks; deliver, retry, cancel |
| `/o/[orgId]/pull-requests[/id]` | PRs opened by AutoAPI, rendered body, sync |
| `/o/[orgId]/notifications`, `/jobs` | In-app notifications; background jobs with retry/cancel |
| `/o/[orgId]/settings` | General, members and invites, GitHub installations, audit trail |
| `/o/[orgId]/billing` | Plans in your currency and provider, checkout return, cancel, payments, portal |

## Environment

| Variable | Purpose |
| --- | --- |
| `AUTOAPI_API_URL` | Upstream API including `/api/v1` (server-only) |
| `NEXTAUTH_SECRET` | 32+ random characters; encrypts the session cookie |
| `NEXTAUTH_URL` | Public URL of this app |
| `NEXT_PUBLIC_APP_URL` | Same, used for billing return URLs and origin checks |
