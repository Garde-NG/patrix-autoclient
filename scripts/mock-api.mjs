#!/usr/bin/env node
/**
 * Minimal in-memory stand-in for the AutoAPI API, for frontend development without the backend.
 *   node scripts/mock-api.mjs            # listens on :8000, serves /api/v1/*
 * Sign in with any email + password "password". Mirrors the {success, message, data} envelope.
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 8000);
const PREFIX = "/api/v1";
const now = () => new Date().toISOString();
const ago = (h) => new Date(Date.now() - h * 3600_000).toISOString();

const user = { id: randomUUID(), email: "dev@example.com", name: "Dev User", is_active: true, is_suspended: false, last_login_at: now(), created_at: ago(400) };
const org = { id: randomUUID(), name: "Dev Workspace", slug: "dev-workspace", plan_code: "free", settings: {}, created_at: ago(400) };
const org2 = { id: randomUUID(), name: "Acme Payments", slug: "acme", plan_code: "pro", settings: {}, created_at: ago(900) };
const sourceId = randomUUID(), repoId = randomUUID(), changeId = randomUUID(), findingId = randomUUID(), repairId = randomUUID(), prId = randomUUID(), instId = randomUUID(), integrationId = randomUUID();

const db = {
  sources: [
    { id: sourceId, organization_id: org.id, provider_key: "stripe", name: "Stripe API", kind: "openapi", url: "https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json", status: "active", poll_interval_seconds: 3600, next_poll_at: new Date(Date.now() + 1800_000).toISOString(), last_polled_at: ago(0.5), last_fetch_status: "ok", last_fetch_error: null, consecutive_failures: 0, latest_snapshot_id: randomUUID(), auth_type: null, auth_header_name: null, has_credential: false, created_at: ago(200), updated_at: ago(0.5) },
    { id: randomUUID(), organization_id: org.id, provider_key: "twilio", name: "Twilio Messaging", kind: "openapi", url: "https://example.com/twilio.json", status: "errored", poll_interval_seconds: 21600, next_poll_at: null, last_polled_at: ago(3), last_fetch_status: "http_error", last_fetch_error: "HTTP 503 from upstream after 3 retries", consecutive_failures: 4, latest_snapshot_id: null, auth_type: "bearer", auth_header_name: null, has_credential: true, created_at: ago(100), updated_at: ago(3) },
  ],
  snapshots: [1, 2, 3].map((v) => ({ id: randomUUID(), api_source_id: sourceId, version: v, origin: v === 1 ? "upload" : "fetch", content_hash: randomUUID().replace(/-/g, ""), raw_format: "json", byte_size: 418_223 + v * 1200, spec_format: "openapi", spec_version_label: "3.0.0", etag: null, fetched_at: ago(100 - v * 30), created_at: ago(100 - v * 30) })),
  diffs: [{ id: randomUUID(), api_source_id: sourceId, base_snapshot_id: randomUUID(), revision_snapshot_id: randomUUID(), status: "done", engine: "oasdiff", engine_version: "1.10.4", error: null, change_counts: { breaking: 6, informational: 10 }, duration_ms: 1840, created_at: ago(10), updated_at: ago(10) }],
  changes: [
    { id: changeId, api_source_id: sourceId, spec_diff_id: randomUUID(), first_seen_snapshot_id: randomUUID(), last_seen_snapshot_id: randomUUID(), occurrences: 1, category: "request_property_removed", severity: "breaking", rule_id: "request-property-removed", oasdiff_level: 3, operation_method: "POST", operation_path: "/v1/payment_intents", operation_id: "PostPaymentIntents", section: "paths", location: { path: "/v1/payment_intents", method: "post" }, summary: "removed the request property 'statement_descriptor' from the request body", comment: null, inferred_by: "oasdiff", created_at: ago(10), updated_at: ago(10), evidence: { id: "request-property-removed", text: "removed the request property 'statement_descriptor'", level: 3 }, fingerprint: null, dedupe_key: "x" },
    { id: randomUUID(), api_source_id: sourceId, spec_diff_id: randomUUID(), first_seen_snapshot_id: randomUUID(), last_seen_snapshot_id: randomUUID(), occurrences: 2, category: "response_property_added", severity: "informational", rule_id: "response-property-added", oasdiff_level: 1, operation_method: "GET", operation_path: "/v1/customers/{customer}", operation_id: null, section: "paths", location: null, summary: "added the optional property 'tax_exempt' to the response", comment: null, inferred_by: "oasdiff", created_at: ago(12), updated_at: ago(2), evidence: {}, fingerprint: null, dedupe_key: "y" },
    { id: randomUUID(), api_source_id: sourceId, spec_diff_id: randomUUID(), first_seen_snapshot_id: randomUUID(), last_seen_snapshot_id: randomUUID(), occurrences: 1, category: "endpoint_deprecated", severity: "warning", rule_id: "endpoint-deprecated", oasdiff_level: 2, operation_method: "DELETE", operation_path: "/v1/charges/{charge}/refund", operation_id: null, section: "paths", location: null, summary: "endpoint deprecated", comment: null, inferred_by: "oasdiff", created_at: ago(30), updated_at: ago(30), evidence: {}, fingerprint: null, dedupe_key: "z" },
  ],
  findings: [
    { id: findingId, organization_id: org.id, api_source_id: sourceId, api_change_id: changeId, repository_id: repoId, integration_id: integrationId, explanation: "src/billing/intents.ts sends statement_descriptor on every PaymentIntent create call. The provider removed this property, so requests will be rejected once the change ships.", kind: "api_change", status: "likely_impact", severity: "breaking", confidence: "high", title: "statement_descriptor removed from POST /v1/payment_intents", summary: "A request property your code sends was removed from the Stripe API.", evidence: [{ file: "src/billing/intents.ts", line: 42, snippet: "await stripe.paymentIntents.create({ amount, currency, statement_descriptor: label })", kind: "call" }, { file: "src/billing/intents.ts", line: 88, snippet: "statement_descriptor: truncate(label, 22)", kind: "token" }], unknowns: ["The SDK version pinned in package.json (^14.0.0) may already strip unknown properties.", "Dynamic property spreads in src/billing/helpers.ts could not be resolved statically."], suggested_action: "Remove statement_descriptor or move it to statement_descriptor_suffix as documented by the provider.", acknowledged_at: null, dismissed_at: null, resolved_at: null, created_at: ago(10), updated_at: ago(10) },
    { id: randomUUID(), organization_id: org.id, api_source_id: sourceId, api_change_id: null, repository_id: null, integration_id: null, explanation: null, kind: "source_unreachable", status: "potential_risk", severity: "warning", confidence: "high", title: "Twilio Messaging has failed 4 fetches in a row", summary: "The source could not be fetched; monitoring is stale.", evidence: [], unknowns: [], suggested_action: "Check the URL and credential.", acknowledged_at: null, dismissed_at: null, resolved_at: null, created_at: ago(3), updated_at: ago(3) },
    { id: randomUUID(), organization_id: org.id, api_source_id: sourceId, api_change_id: null, repository_id: null, integration_id: null, explanation: null, kind: "baseline_captured", status: "informational", severity: "informational", confidence: "high", title: "Baseline captured for Stripe API", summary: "The first snapshot was stored. Changes are detected from the next one.", evidence: [], unknowns: [], suggested_action: null, acknowledged_at: ago(90), dismissed_at: null, resolved_at: null, created_at: ago(100), updated_at: ago(90) },
  ],
  repositories: [{ id: repoId, organization_id: org.id, installation_id: instId, github_repo_id: 1, full_name: "autoapi-dev/checkout-service", default_branch: "main", selected_branch: "main", is_private: true, html_url: "https://github.com/autoapi-dev/checkout-service", is_active: true, connection_status: "connected", last_scan_id: randomUUID(), last_scan_at: ago(4), last_scanned_sha: "a1b2c3d4e5f6a7b8", created_at: ago(150), updated_at: ago(4), integrations_count: 3, open_findings_count: 1, is_mock: true }],
  scans: [{ id: randomUUID(), repository_id: repoId, status: "succeeded", trigger: "push", branch: "main", commit_sha: "a1b2c3d4e5f6a7b8", stats: { files: 412, manifests: 2, source_files_analyzed: 118, skipped_vendor_dirs: 3 }, limitations: ["Dynamic require() calls were not followed.", "Minified bundles under dist/ were skipped."], integrations_found: 3, error: null, started_at: ago(4.1), finished_at: ago(4), created_at: ago(4.1) }, { id: randomUUID(), repository_id: repoId, status: "running", trigger: "manual", branch: "main", commit_sha: null, stats: {}, limitations: [], integrations_found: 0, error: null, started_at: ago(0.01), finished_at: null, created_at: ago(0.02) }],
  integrations: [
    { id: integrationId, repository_id: repoId, organization_id: org.id, scan_id: null, provider_key: "stripe", package_name: "stripe", ecosystem: "npm", version_spec: "^14.0.0", resolved_version: "14.25.0", confidence: "high", detection_method: "manifest+usage", evidence: [{ file: "package.json", line: 18, kind: "manifest" }, { file: "src/billing/intents.ts", line: 3, kind: "import", snippet: "import Stripe from 'stripe'" }], status: "active", api_source_id: sourceId, first_seen_at: ago(150), last_seen_at: ago(4), code_references: [{ file: "src/billing/intents.ts", line: 42, kind: "call", token: "paymentIntents.create" }] },
    { id: randomUUID(), repository_id: repoId, organization_id: org.id, scan_id: null, provider_key: "twilio", package_name: "twilio", ecosystem: "npm", version_spec: "~4.2.0", resolved_version: null, confidence: "low", detection_method: "manifest", evidence: [{ file: "package.json", line: 22, kind: "manifest" }], status: "active", api_source_id: null, first_seen_at: ago(150), last_seen_at: ago(4), code_references: [] },
    { id: randomUUID(), repository_id: repoId, organization_id: org.id, scan_id: null, provider_key: "sendgrid", package_name: "@sendgrid/mail", ecosystem: "npm", version_spec: "^8.1.0", resolved_version: "8.1.3", confidence: "medium", detection_method: "usage", evidence: [{ file: "src/mail.ts", line: 1, kind: "import" }], status: "active", api_source_id: null, first_seen_at: ago(150), last_seen_at: ago(4), code_references: [] },
  ],
  repairs: [{ id: repairId, organization_id: org.id, repository_id: repoId, finding_id: findingId, api_change_id: changeId, integration_id: integrationId, status: "verified", max_attempts: 2, attempt_count: 1, current_attempt_id: randomUUID(), policy: { allowed_files: ["src/billing/intents.ts"], new_files_only_in: ["src/**/__tests__/**"], checks: ["install", "typecheck", "test"] }, error: null, requested_by_id: user.id, finished_at: ago(1), created_at: ago(2), updated_at: ago(1), attempts: [{ id: randomUUID(), repair_job_id: repairId, number: 1, status: "verified", agent_name: "claude", model: "claude-opus-5-5", explanation: "Replaced statement_descriptor with statement_descriptor_suffix on PaymentIntent creation and added a unit test covering the 22-character truncation.", affected_files: ["src/billing/intents.ts"], tests_added: ["src/billing/__tests__/intents.test.ts"], uncertainties: ["The suffix is limited to 22 characters by the provider; existing labels longer than that are truncated."], token_usage: { input: 18_400, output: 2_110 }, base_commit_sha: "a1b2c3d4e5f6a7b8", error: null, started_at: ago(2), finished_at: ago(1.5), patch: "diff --git a/src/billing/intents.ts b/src/billing/intents.ts\n--- a/src/billing/intents.ts\n+++ b/src/billing/intents.ts\n@@ -40,7 +40,7 @@ export async function createIntent(amount: number, currency: string, label: string) {\n   return stripe.paymentIntents.create({\n     amount,\n     currency,\n-    statement_descriptor: label,\n+    statement_descriptor_suffix: truncate(label, 22),\n   });\n }\n", task: { files: ["src/billing/intents.ts"] }, verification_runs: [{ id: randomUUID(), repair_attempt_id: randomUUID(), runner: "docker", isolation: "container", status: "passed", verification_level: "full", checks: [{ name: "install", status: "passed", command: "npm ci", exit_code: 0, duration_ms: 24_100, output: "added 412 packages in 24s" }, { name: "typecheck", status: "passed", command: "npx tsc --noEmit", exit_code: 0, duration_ms: 6_300, output: "" }, { name: "test", status: "passed", command: "npm test -- --run", exit_code: 0, duration_ms: 9_900, output: "Test Files  12 passed (12)\nTests  88 passed (88)" }], changed_files: ["src/billing/intents.ts", "src/billing/__tests__/intents.test.ts"], error: null, started_at: ago(1.4), finished_at: ago(1) }] }], pull_request: null }],
  pull_requests: [{ id: prId, organization_id: org.id, repository_id: repoId, repair_job_id: repairId, repair_attempt_id: randomUUID(), finding_id: findingId, branch: "autoapi/repair-1", base_branch: "main", base_sha: "a1b2c3d4e5f6a7b8", head_sha: "f9e8d7c6b5a4", number: 142, html_url: "https://github.com/autoapi-dev/checkout-service/pull/142", title: "fix(billing): migrate statement_descriptor to statement_descriptor_suffix", state: "open", is_draft: false, is_mock: true, files: ["src/billing/intents.ts"], verification: { runner: "docker", status: "passed" }, error: null, delivered_by_id: user.id, opened_at: ago(0.5), merged_at: null, closed_at: null, last_synced_at: ago(0.5), created_at: ago(0.6), updated_at: ago(0.5), body: "## API change\n\nStripe removed `statement_descriptor` from `POST /v1/payment_intents`.\n\n## Why this repository is affected\n\n- `src/billing/intents.ts:42` sends the property on every call.\n\n## Verification\n\n| Check | Result |\n| --- | --- |\n| install | passed |\n| typecheck | passed |\n| test | passed |\n\n_Opened by AutoAPI. Never merged automatically._" }],
  notifications: [{ id: randomUUID(), organization_id: org.id, user_id: null, type: "finding.breaking", title: "Breaking change in Stripe API", body: "statement_descriptor removed from POST /v1/payment_intents affects checkout-service.", data: { finding_id: findingId }, read_at: null, dismissed_at: null, created_at: ago(10) }, { id: randomUUID(), organization_id: org.id, user_id: null, type: "repair.verified", title: "Repair verified", body: "A patch for checkout-service passed all checks and is ready to deliver.", data: { repair_job_id: repairId }, read_at: ago(0.9), dismissed_at: null, created_at: ago(1) }],
  jobs: [{ id: randomUUID(), kind: "repo.scan", status: "running", payload: { repository_id: repoId }, run_at: ago(0.02), attempts: 1, max_attempts: 3, last_error: null, result: null, organization_id: org.id, started_at: ago(0.01), finished_at: null, created_at: ago(0.02) }, { id: randomUUID(), kind: "source.fetch", status: "dead", payload: { source_id: "x" }, run_at: ago(3), attempts: 3, max_attempts: 3, last_error: "HTTP 503 from upstream after 3 retries", result: null, organization_id: org.id, started_at: ago(3), finished_at: ago(2.9), created_at: ago(3.2) }, { id: randomUUID(), kind: "spec.diff", status: "succeeded", payload: {}, run_at: ago(10), attempts: 1, max_attempts: 3, last_error: null, result: { breaking: 6 }, organization_id: org.id, started_at: ago(10), finished_at: ago(9.99), created_at: ago(10) }],
  audit: [{ id: randomUUID(), organization_id: org.id, actor_user_id: user.id, actor_email: user.email, action: "repair.deliver", target_type: "repair_job", target_id: repairId, success: true, ip_address: "127.0.0.1", user_agent: "mock", event_metadata: null, created_at: ago(0.6) }, { id: randomUUID(), organization_id: org.id, actor_user_id: user.id, actor_email: user.email, action: "auth.login", target_type: null, target_id: null, success: false, ip_address: "127.0.0.1", user_agent: "mock", event_metadata: null, created_at: ago(30) }],
  installations: [{ id: instId, organization_id: org.id, installation_id: 1, account_login: "autoapi-dev", account_type: "Organization", permissions: { contents: "read", metadata: "read", pull_requests: "write" }, status: "active", is_mock: true, created_at: ago(150) }],
  members: [{ id: randomUUID(), user_id: user.id, email: user.email, name: user.name, role: "owner", created_at: ago(400) }, { id: randomUUID(), user_id: randomUUID(), email: "sam@example.com", name: "Sam Rivera", role: "member", created_at: ago(30) }],
  invites: [{ id: randomUUID(), organization_id: org.id, email: "lee@example.com", role: "admin", expires_at: new Date(Date.now() + 48 * 3600_000).toISOString(), accepted_at: null, revoked_at: null, created_at: ago(1) }],
  payments: [{ id: randomUUID(), organization_id: org.id, subscription_id: null, provider: "paystack", external_id: "ref_123", status: "paid", amount_minor: 1_500_000, amount: "15,000.00", currency: "NGN", description: "Pro · monthly", receipt_url: null, failure_reason: null, paid_at: ago(100), created_at: ago(100) }],
};

const plans = {
  plans: [
    { code: "free", name: "Free", description: "Watch a couple of APIs and one repository.", is_self_serve: true, trial_days: 0, limits: { repositories: 1, members: 2, scans_per_month: 10, repair_attempts_per_month: 0, verification_runs_per_month: 0, pull_requests_per_month: 0 }, features: [], prices: [] },
    { code: "starter", name: "Starter", description: "For a small team shipping against a few providers.", is_self_serve: true, trial_days: 14, limits: { repositories: 5, members: 5, scans_per_month: 200, repair_attempts_per_month: 20, verification_runs_per_month: 40, pull_requests_per_month: 10 }, features: ["Email alerts"], prices: [{ id: randomUUID(), currency: "USD", interval: "month", amount_minor: 2900, amount: "29.00", purchasable: true, providers: ["stripe", "mock"] }, { id: randomUUID(), currency: "USD", interval: "year", amount_minor: 29000, amount: "290.00", purchasable: true, providers: ["stripe", "mock"] }, { id: randomUUID(), currency: "NGN", interval: "month", amount_minor: 4500000, amount: "45,000.00", purchasable: true, providers: ["paystack", "mock"] }] },
    { code: "pro", name: "Pro", description: "Unlimited monitoring, verified repairs on every change.", is_self_serve: true, trial_days: 14, limits: { repositories: 25, members: 20, scans_per_month: 2000, repair_attempts_per_month: 200, verification_runs_per_month: 400, pull_requests_per_month: 100 }, features: ["Priority verification", "Docker isolation"], prices: [{ id: randomUUID(), currency: "USD", interval: "month", amount_minor: 9900, amount: "99.00", purchasable: true, providers: ["stripe", "mock"] }, { id: randomUUID(), currency: "USD", interval: "year", amount_minor: 99000, amount: "990.00", purchasable: true, providers: ["stripe", "mock"] }, { id: randomUUID(), currency: "NGN", interval: "month", amount_minor: 15000000, amount: "150,000.00", purchasable: true, providers: ["paystack", "mock"] }] },
    { code: "enterprise", name: "Enterprise", description: "SSO, custom limits and a dedicated verification host.", is_self_serve: false, trial_days: 0, limits: { repositories: null, members: null, scans_per_month: null, repair_attempts_per_month: null, verification_runs_per_month: null, pull_requests_per_month: null }, features: ["SSO", "Dedicated support"], prices: [] },
  ],
  currencies: ["USD", "EUR", "GBP", "NGN"],
  providers: [{ key: "stripe", display_name: "Stripe", note: "Cards and wallets in USD, EUR and GBP.", is_mock: false, currencies: ["USD", "EUR", "GBP"] }, { key: "paystack", display_name: "Paystack", note: "Naira cards, bank transfer, USSD and mobile money.", is_mock: false, currencies: ["NGN", "GHS", "ZAR", "KES"] }, { key: "mock", display_name: "Mock provider", note: "Development only. No money moves.", is_mock: true, currencies: ["USD", "NGN"] }],
  current_plan_code: "free",
};

const usage = () => ({ plan_code: "free", plan_name: "Free", period_start: ago(240), metrics: { repositories: { used: 1, limit: 1, remaining: 0, period: "current" }, members: { used: 2, limit: 2, remaining: 0, period: "current" }, scans_per_month: { used: 7, limit: 10, remaining: 3, period: "month" }, repair_attempts_per_month: { used: 1, limit: 0, remaining: 0, period: "month" }, verification_runs_per_month: { used: 1, limit: 0, remaining: 0, period: "month" }, pull_requests_per_month: { used: 1, limit: 0, remaining: 0, period: "month" } }, enforced: true });

const tokens = () => ({ access_token: "mock-access", refresh_token: "mock-refresh", token_type: "bearer", expires_in: 3600, user });
const page = (items, q) => {
  const p = Number(q.get("page") ?? 1), size = Number(q.get("page_size") ?? 20);
  return { items: items.slice((p - 1) * size, p * size), meta: { page: p, page_size: size, total_items: items.length, total_pages: Math.max(1, Math.ceil(items.length / size)) } };
};
const ok = (res, data, message = "OK", status = 200) => { res.writeHead(status, { "Content-Type": "application/json", "X-Request-ID": randomUUID() }); res.end(JSON.stringify({ success: true, message, data })); };
const fail = (res, status, message, errors = []) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify({ success: false, message, errors })); };
const readJson = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { r(b ? JSON.parse(b) : {}); } catch { r({}); } }); });

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/health") return ok(res, { status: "ok", env: "mock" });
  if (!url.pathname.startsWith(PREFIX)) return fail(res, 404, "Not found.");
  const path = url.pathname.slice(PREFIX.length).replace(/^\/|\/$/g, "");
  const seg = path.split("/");
  const body = req.method === "GET" ? {} : await readJson(req);
  const auth = req.headers.authorization === "Bearer mock-access";
  await new Promise((r) => setTimeout(r, 120)); // a little latency so loading states are visible
  console.log(req.method, path);

  if (path === "auth/login") return body.password === "password" ? ok(res, tokens(), "Logged in.") : fail(res, 401, "Invalid email or password.");
  if (path === "auth/signup") return ok(res, tokens(), "Account created.", 201);
  if (path === "auth/refresh") return ok(res, tokens());
  if (path === "auth/logout") return ok(res, null);
  if (path === "billing/plans") return ok(res, plans);
  if (!auth) return fail(res, 401, "Not authenticated.");
  if (path === "auth/me") return ok(res, user);
  if (path === "auth/change-password") return body.current_password === "password" ? ok(res, null, "Password changed.") : fail(res, 400, "Current password is incorrect.", [{ field: "current_password", message: "Incorrect password." }]);
  if (path === "orgs" && req.method === "GET") return ok(res, [{ ...org, role: "owner" }, { ...org2, role: "member" }]);
  if (path === "orgs" && req.method === "POST") { const o = { id: randomUUID(), name: body.name, slug: body.slug ?? body.name.toLowerCase().replace(/\W+/g, "-"), plan_code: "free", settings: {}, created_at: now() }; return ok(res, o, "Created.", 201); }
  if (path === "invites/accept") return ok(res, org2);
  if (seg[0] !== "orgs") return fail(res, 404, "Not found.");
  const orgId = seg[1];
  if (orgId !== org.id && orgId !== org2.id) return fail(res, 404, "Organization not found.");
  const current = orgId === org.id ? org : org2;
  const rest = seg.slice(2);
  const [r0, r1, r2, r3] = rest;
  if (!r0) return req.method === "PATCH" ? ok(res, Object.assign(current, { name: body.name ?? current.name })) : ok(res, { ...current, role: orgId === org.id ? "owner" : "member" });
  const scoped = (list) => (orgId === org.id ? list : []);

  if (r0 === "members") { if (req.method === "DELETE") { db.members = db.members.filter((m) => m.id !== r1); return ok(res, null); } if (req.method === "PATCH") { const m = db.members.find((m) => m.id === r1); if (m) m.role = body.role; return ok(res, null); } return ok(res, scoped(db.members)); }
  if (r0 === "invites") { if (req.method === "POST") { const inv = { id: randomUUID(), organization_id: orgId, email: body.email, role: body.role, expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(), accepted_at: null, revoked_at: null, created_at: now(), token: "inv_" + randomUUID() }; db.invites.push(inv); return ok(res, inv, "Invited.", 201); } if (req.method === "DELETE") { db.invites = db.invites.filter((i) => i.id !== r1); return ok(res, null); } return ok(res, scoped(db.invites)); }
  if (r0 === "usage") return ok(res, usage());
  if (r0 === "billing") {
    if (r1 === "plans") return ok(res, plans);
    if (r1 === "subscription" && !r2) return ok(res, { subscription: null, plan_code: "free", plan_name: "Free", limits: {}, usage: usage() });
    if (r1 === "subscription" && r2 === "cancel") return ok(res, null);
    if (r1 === "checkout" && req.method === "POST") return ok(res, { id: randomUUID(), organization_id: orgId, plan_price_id: randomUUID(), provider: body.provider ?? "mock", reference: "chk_1", status: "pending", url: body.success_url?.replace("{CHECKOUT_ID}", "chk-mock") ?? null, subscription_id: null, error: null, expires_at: null, completed_at: null, created_at: now(), is_mock: true }, "Checkout created.", 201);
    if (r1 === "checkout") return ok(res, { id: r2, organization_id: orgId, plan_price_id: randomUUID(), provider: "mock", reference: "chk_1", status: "completed", url: null, subscription_id: randomUUID(), error: null, expires_at: null, completed_at: now(), created_at: now(), is_mock: true });
    if (r1 === "portal") return ok(res, { url: "https://example.com/portal", provider: "mock", is_mock: true });
    if (r1 === "payments") return ok(res, page(scoped(db.payments), url.searchParams));
  }
  if (r0 === "github") {
    if (r1 === "install-url") return ok(res, { url: null, is_mock: true, note: "Development mock: fixture repositories are served as installation 1." });
    if (r1 === "installations" && !r2) return req.method === "POST" ? ok(res, db.installations[0], "Linked.", 201) : ok(res, scoped(db.installations));
    if (r1 === "installations" && r3 === "repositories") return ok(res, [{ github_repo_id: 1, full_name: "autoapi-dev/checkout-service", default_branch: "main", is_private: true, html_url: "https://github.com/autoapi-dev/checkout-service", is_mock: true, connected_repository_id: repoId }, { github_repo_id: 2, full_name: "autoapi-dev/notifications-worker", default_branch: "main", is_private: false, html_url: "https://github.com/autoapi-dev/notifications-worker", is_mock: true, connected_repository_id: null }]);
    if (r1 === "installations" && req.method === "DELETE") return ok(res, null);
  }
  const collections = { sources: db.sources, changes: db.changes, findings: db.findings, repositories: db.repositories, integrations: db.integrations, repairs: db.repairs, "pull-requests": db.pull_requests, notifications: db.notifications, jobs: db.jobs, audit: db.audit };
  const list = collections[r0];
  if (!list) return fail(res, 404, "Not found.");
  const items = scoped(list);
  if (!r1) {
    if (req.method === "POST") {
      if (r0 === "sources") { const s = { ...db.sources[0], id: randomUUID(), name: body.name, provider_key: body.provider_key, url: body.url ?? null, last_polled_at: null, latest_snapshot_id: null, status: "active", consecutive_failures: 0, last_fetch_status: null, last_fetch_error: null, has_credential: !!body.credential, created_at: now(), updated_at: now() }; db.sources.unshift(s); return ok(res, s, "Created.", 201); }
      if (r0 === "repositories") { const r = { ...db.repositories[0], id: randomUUID(), full_name: body.full_name, last_scan_at: null, last_scanned_sha: null, created_at: now(), integrations_count: 0, open_findings_count: 0 }; db.repositories.push(r); return ok(res, r, "Connected.", 201); }
    }
    let filtered = items;
    for (const [k, v] of url.searchParams) {
      if (["page", "page_size", "include_dismissed", "include_stale", "unread_only"].includes(k)) continue;
      const key = k === "source_id" ? "api_source_id" : k;
      filtered = filtered.filter((i) => String(i[key]) === v);
    }
    if (r0 === "findings" && url.searchParams.get("include_dismissed") !== "true" && !url.searchParams.get("status")) filtered = filtered.filter((f) => f.status !== "dismissed");
    if (r0 === "notifications" && url.searchParams.get("unread_only") === "true") filtered = filtered.filter((n) => !n.read_at);
    return ok(res, page(filtered, url.searchParams));
  }
  if (r1 === "read-all") { db.notifications.forEach((n) => (n.read_at ??= now())); return ok(res, { updated: 1 }); }
  const item = items.find((i) => i.id === r1);
  if (!item) return fail(res, 404, "Not found.");
  if (!r2) {
    if (req.method === "DELETE") { collections[r0].splice(collections[r0].indexOf(item), 1); return ok(res, null); }
    if (req.method === "PATCH") { Object.assign(item, body, { updated_at: now() }); if (body.status) item.status = body.status; if (body.is_active === false) item.is_active = false; if (body.is_active === true) item.is_active = true; return ok(res, item); }
    if (r0 === "sources" || r0 === "pull-requests") return ok(res, item);
    return ok(res, item);
  }
  // Sub-resources and actions
  if (r0 === "sources") {
    if (r2 === "snapshots" && !r3) return req.method === "POST" ? ok(res, { created: true, snapshot: { ...db.snapshots[0], id: randomUUID(), version: 4, origin: "upload", fetched_at: now(), created_at: now() }, diff_id: randomUUID() }, "Snapshot 4 stored.", 201) : ok(res, page(db.snapshots.slice().reverse(), url.searchParams));
    if (r2 === "snapshots") return ok(res, { ...db.snapshots[0], content: JSON.stringify({ openapi: "3.0.0", info: { title: "Stripe API", version: "2024-06-20" }, paths: { "/v1/payment_intents": { post: { summary: "Create a PaymentIntent" } } } }, null, 2) });
    if (r2 === "diffs") return ok(res, page(db.diffs, url.searchParams));
    if (r2 === "fetch") return ok(res, { job_id: randomUUID() }, "Fetch queued.", 202);
  }
  if (r0 === "repositories") {
    if (r2 === "scans" && !r3) return ok(res, page(db.scans, url.searchParams));
    if (r2 === "scans") return ok(res, db.scans[0]);
    if (r2 === "scan") { const s = { ...db.scans[1], id: randomUUID(), status: "queued", created_at: now() }; db.scans.unshift(s); return ok(res, s, "Scan queued.", 202); }
  }
  if (r0 === "findings") {
    if (r2 === "acknowledge") { item.acknowledged_at = now(); return ok(res, item); }
    if (r2 === "dismiss") { item.status = "dismissed"; item.dismissed_at = now(); return ok(res, item); }
    if (r2 === "reopen") { item.status = "potential_risk"; item.dismissed_at = null; return ok(res, item); }
    if (r2 === "repairs") return fail(res, 503, "AI repair is not configured on this server (AI_PROVIDER=none).");
  }
  if (r0 === "repairs") {
    if (r2 === "deliver") { item.status = "delivering"; setTimeout(() => { item.status = "delivered"; item.pull_request = db.pull_requests[0]; }, 3000); return ok(res, item, "Delivery queued.", 202); }
    if (r2 === "retry") { item.status = "queued"; return ok(res, item); }
    if (r2 === "cancel") { item.status = "cancelled"; return ok(res, item); }
  }
  if (r0 === "pull-requests" && r2 === "sync") return ok(res, item);
  if (r0 === "notifications") { if (r2 === "read") item.read_at = now(); if (r2 === "dismiss") item.dismissed_at = now(); return ok(res, item); }
  if (r0 === "jobs") { if (r2 === "retry") item.status = "queued"; if (r2 === "cancel") item.status = "cancelled"; return ok(res, null); }
  return fail(res, 404, "Not found.");
}).listen(PORT, () => console.log(`Mock AutoAPI API on http://localhost:${PORT}${PREFIX} (password: "password")`));
