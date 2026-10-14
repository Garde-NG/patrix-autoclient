/* Mirrors the API schemas (app/features/<feature>/schemas.py). Keep field names identical to the wire format. */

export type UUID = string;
export type ISODate = string;

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PageParams {
  page?: number;
  page_size?: number;
}

/* ---------------------------------- Organizations --------------------------------- */

export type OrgRole = "owner" | "admin" | "member";

export const ROLE_RANK: Record<OrgRole, number> = { member: 0, admin: 1, owner: 2 };

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  plan_code: string;
  settings: Record<string, unknown>;
  created_at: ISODate;
}

export interface OrganizationWithRole extends Organization {
  role: OrgRole;
}

export interface OrganizationCreate {
  name: string;
  slug?: string;
}

export interface OrganizationUpdate {
  name?: string;
  settings?: Record<string, unknown>;
}

export interface Member {
  id: UUID;
  user_id: UUID;
  email: string;
  name: string;
  role: OrgRole;
  created_at: ISODate;
}

export interface Invite {
  id: UUID;
  organization_id: UUID;
  email: string;
  role: OrgRole;
  expires_at: ISODate;
  accepted_at: ISODate | null;
  revoked_at: ISODate | null;
  created_at: ISODate;
}

export interface InviteCreated extends Invite {
  token: string;
}

/* ------------------------------------- Sources ------------------------------------ */

export type SourceKind = "openapi";
export type SourceStatus = "active" | "paused" | "errored";

export interface SourceCredential {
  auth_type: "header" | "basic" | "bearer";
  secret: string;
  header_name?: string | null;
}

export interface SourceCreate {
  provider_key: string;
  name: string;
  kind?: SourceKind;
  url?: string | null;
  poll_interval_seconds?: number;
  credential?: SourceCredential | null;
}

export interface SourceUpdate {
  name?: string;
  url?: string | null;
  status?: "active" | "paused";
  poll_interval_seconds?: number;
  credential?: SourceCredential | null;
  clear_credential?: boolean;
}

export interface Source {
  id: UUID;
  organization_id: UUID;
  provider_key: string;
  name: string;
  kind: SourceKind;
  url: string | null;
  status: SourceStatus;
  poll_interval_seconds: number;
  next_poll_at: ISODate | null;
  last_polled_at: ISODate | null;
  last_fetch_status: string | null;
  last_fetch_error: string | null;
  consecutive_failures: number;
  latest_snapshot_id: UUID | null;
  auth_type: string | null;
  auth_header_name: string | null;
  has_credential: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Snapshot {
  id: UUID;
  api_source_id: UUID;
  version: number;
  origin: string;
  content_hash: string;
  raw_format: string;
  byte_size: number;
  spec_format: string;
  spec_version_label: string | null;
  etag: string | null;
  fetched_at: ISODate;
  created_at: ISODate;
}

export interface SnapshotDetail extends Snapshot {
  content: string;
}

export interface SnapshotUploadResult {
  created: boolean;
  snapshot: Snapshot | null;
  diff_id: UUID | null;
}

export type DiffStatus = "pending" | "done" | "failed";

export interface Diff {
  id: UUID;
  api_source_id: UUID;
  base_snapshot_id: UUID;
  revision_snapshot_id: UUID;
  status: DiffStatus;
  engine: string;
  engine_version: string | null;
  error: string | null;
  change_counts: Record<string, number> | null;
  duration_ms: number | null;
  created_at: ISODate;
  updated_at: ISODate;
}

/* ------------------------------------- Changes ------------------------------------ */

export type Severity = "breaking" | "warning" | "informational";

export interface ApiChange {
  id: UUID;
  api_source_id: UUID;
  spec_diff_id: UUID;
  first_seen_snapshot_id: UUID;
  last_seen_snapshot_id: UUID;
  occurrences: number;
  category: string;
  severity: Severity;
  rule_id: string;
  oasdiff_level: number;
  operation_method: string | null;
  operation_path: string | null;
  operation_id: string | null;
  section: string;
  location: Record<string, unknown> | null;
  summary: string;
  comment: string | null;
  inferred_by: string;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface ApiChangeDetail extends ApiChange {
  evidence: Record<string, unknown>;
  fingerprint: string | null;
  dedupe_key: string;
}

export interface ChangeFilters extends PageParams {
  source_id?: string;
  severity?: Severity;
  category?: string;
  diff_id?: string;
}

/* ------------------------------------- Findings ----------------------------------- */

export type FindingStatus =
  | "informational"
  | "potential_risk"
  | "likely_impact"
  | "confirmed_incompatibility"
  | "repair_available"
  | "resolved"
  | "dismissed";

export type FindingKind = "api_change" | "baseline_captured" | "source_unreachable";
export type Confidence = "high" | "medium" | "low";

export interface FindingEvidence {
  file?: string;
  line?: number;
  snippet?: string;
  kind?: string;
  [key: string]: unknown;
}

export interface Finding {
  id: UUID;
  organization_id: UUID;
  api_source_id: UUID | null;
  api_change_id: UUID | null;
  repository_id: UUID | null;
  integration_id: UUID | null;
  explanation: string | null;
  kind: FindingKind;
  status: FindingStatus;
  severity: Severity;
  confidence: Confidence | string;
  title: string;
  summary: string;
  evidence: FindingEvidence[];
  unknowns: string[];
  suggested_action: string | null;
  acknowledged_at: ISODate | null;
  dismissed_at: ISODate | null;
  resolved_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface FindingFilters extends PageParams {
  status?: string;
  severity?: Severity;
  kind?: FindingKind;
  source_id?: string;
  repository_id?: string;
  include_dismissed?: boolean;
}

/* ---------------------------------- Notifications --------------------------------- */

export interface Notification {
  id: UUID;
  organization_id: UUID;
  user_id: UUID | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: ISODate | null;
  dismissed_at: ISODate | null;
  created_at: ISODate;
}

/* -------------------------------------- GitHub ------------------------------------ */

export interface InstallUrl {
  url: string | null;
  is_mock: boolean;
  note: string;
}

export type InstallationStatus = "active" | "suspended" | "removed";

export interface Installation {
  id: UUID;
  organization_id: UUID;
  installation_id: number;
  account_login: string;
  account_type: string;
  permissions: Record<string, string>;
  status: InstallationStatus;
  is_mock: boolean;
  created_at: ISODate;
}

export interface Branch {
  name: string;
  is_default: boolean;
  protected: boolean;
}

export interface SetupResult {
  organization_id: UUID;
  installation: Installation;
  already_linked: boolean;
}

export interface AvailableRepo {
  github_repo_id: number;
  full_name: string;
  default_branch: string;
  is_private: boolean;
  html_url: string;
  is_mock: boolean;
  connected_repository_id: UUID | null;
}

/* ----------------------------------- Repositories --------------------------------- */

export interface RepositoryConnect {
  installation_id: UUID;
  full_name: string;
  branch?: string | null;
}

export interface RepositoryUpdate {
  selected_branch?: string;
  is_active?: boolean;
}

export interface Repository {
  id: UUID;
  organization_id: UUID;
  installation_id: UUID;
  github_repo_id: number;
  full_name: string;
  default_branch: string;
  selected_branch: string;
  is_private: boolean;
  html_url: string | null;
  is_active: boolean;
  connection_status: string;
  last_scan_id: UUID | null;
  last_scan_at: ISODate | null;
  last_scanned_sha: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface RepositorySummary extends Repository {
  integrations_count: number;
  open_findings_count: number;
  is_mock: boolean;
}

export type ScanStatus = "queued" | "running" | "succeeded" | "failed";

export interface Scan {
  id: UUID;
  repository_id: UUID;
  status: ScanStatus;
  trigger: string;
  branch: string;
  commit_sha: string | null;
  stats: Record<string, unknown>;
  limitations: string[];
  integrations_found: number;
  error: string | null;
  started_at: ISODate | null;
  finished_at: ISODate | null;
  created_at: ISODate;
}

export interface IntegrationEvidence {
  file?: string;
  line?: number;
  kind?: string;
  snippet?: string;
  [key: string]: unknown;
}

export interface Integration {
  id: UUID;
  repository_id: UUID;
  organization_id: UUID;
  scan_id: UUID | null;
  provider_key: string;
  package_name: string | null;
  ecosystem: string;
  version_spec: string | null;
  resolved_version: string | null;
  confidence: Confidence | string;
  detection_method: string;
  evidence: IntegrationEvidence[];
  status: string;
  api_source_id: UUID | null;
  first_seen_at: ISODate;
  last_seen_at: ISODate;
}

export interface IntegrationDetail extends Integration {
  code_references: Array<{ file?: string; line?: number; kind?: string; token?: string; [key: string]: unknown }>;
}

export interface IntegrationFilters extends PageParams {
  repository_id?: string;
  provider_key?: string;
  include_stale?: boolean;
}

/* -------------------------------------- Repairs ----------------------------------- */

export type RepairStatus =
  | "queued"
  | "generating"
  | "generated"
  | "verifying"
  | "verified"
  | "verification_failed"
  | "delivering"
  | "delivered"
  | "failed"
  | "cancelled";

export interface VerificationCheck {
  name?: string;
  status?: string;
  command?: string;
  exit_code?: number | null;
  duration_ms?: number | null;
  output?: string;
  [key: string]: unknown;
}

export interface VerificationRun {
  id: UUID;
  repair_attempt_id: UUID;
  runner: string;
  isolation: string;
  status: string;
  verification_level: string;
  checks: VerificationCheck[];
  changed_files: string[];
  error: string | null;
  started_at: ISODate;
  finished_at: ISODate | null;
}

export interface RepairAttempt {
  id: UUID;
  repair_job_id: UUID;
  number: number;
  status: string;
  agent_name: string | null;
  model: string | null;
  explanation: string | null;
  affected_files: string[];
  tests_added: string[];
  uncertainties: string[];
  token_usage: Record<string, number>;
  base_commit_sha: string | null;
  error: string | null;
  started_at: ISODate;
  finished_at: ISODate | null;
}

export interface RepairAttemptDetail extends RepairAttempt {
  patch: string | null;
  task: Record<string, unknown>;
  verification_runs: VerificationRun[];
}

export interface RepairJob {
  id: UUID;
  organization_id: UUID;
  repository_id: UUID;
  finding_id: UUID;
  api_change_id: UUID | null;
  integration_id: UUID | null;
  status: RepairStatus;
  max_attempts: number;
  attempt_count: number;
  current_attempt_id: UUID | null;
  policy: Record<string, unknown>;
  error: string | null;
  requested_by_id: UUID | null;
  finished_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface RepairJobDetail extends RepairJob {
  attempts: RepairAttemptDetail[];
  pull_request: PullRequest | null;
}

export interface RepairFilters extends PageParams {
  repository_id?: string;
  status?: RepairStatus;
}

/* ----------------------------------- Pull requests -------------------------------- */

export type PullRequestState = "pending" | "open" | "merged" | "closed" | "failed";

export interface PullRequest {
  id: UUID;
  organization_id: UUID;
  repository_id: UUID;
  repair_job_id: UUID;
  repair_attempt_id: UUID;
  finding_id: UUID;
  branch: string;
  base_branch: string;
  base_sha: string;
  head_sha: string | null;
  number: number | null;
  html_url: string | null;
  title: string;
  state: PullRequestState;
  is_draft: boolean;
  is_mock: boolean;
  files: string[];
  verification: Record<string, unknown>;
  error: string | null;
  delivered_by_id: UUID | null;
  opened_at: ISODate | null;
  merged_at: ISODate | null;
  closed_at: ISODate | null;
  last_synced_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface PullRequestDetail extends PullRequest {
  body: string;
}

export interface PullRequestFilters extends PageParams {
  repository_id?: string;
  state?: PullRequestState;
}

/* -------------------------------------- Billing ----------------------------------- */

export interface BillingProvider {
  key: string;
  display_name: string;
  note: string;
  is_mock: boolean;
  currencies: string[];
}

export interface PlanPrice {
  id: UUID;
  currency: string;
  interval: "month" | "year";
  amount_minor: number;
  amount: string;
  purchasable: boolean;
  providers: string[];
}

export interface Plan {
  code: string;
  name: string;
  description: string;
  is_self_serve: boolean;
  trial_days: number;
  limits: Record<string, number | null>;
  features: string[];
  prices: PlanPrice[];
}

export interface PlanCatalogue {
  plans: Plan[];
  currencies: string[];
  providers: BillingProvider[];
  current_plan_code: string | null;
}

export interface CheckoutCreate {
  plan_code: string;
  currency: string;
  interval: "month" | "year";
  provider?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface Checkout {
  id: UUID;
  organization_id: UUID;
  plan_price_id: UUID;
  provider: string;
  reference: string;
  status: string;
  url: string | null;
  subscription_id: UUID | null;
  error: string | null;
  expires_at: ISODate | null;
  completed_at: ISODate | null;
  created_at: ISODate;
  is_mock: boolean;
}

export interface Subscription {
  id: UUID;
  organization_id: UUID;
  plan_code: string;
  plan_name: string;
  provider: string;
  status: string;
  currency: string | null;
  amount_minor: number | null;
  amount: string | null;
  interval: string | null;
  current_period_start: ISODate | null;
  current_period_end: ISODate | null;
  trial_end: ISODate | null;
  cancel_at_period_end: boolean;
  cancelled_at: ISODate | null;
  ended_at: ISODate | null;
  is_mock: boolean;
  created_at: ISODate;
}

export interface UsageMetric {
  used: number;
  limit: number | null;
  remaining: number | null;
  period: "month" | "current";
}

export interface UsageSnapshot {
  plan_code: string;
  plan_name: string;
  period_start: ISODate;
  metrics: Record<string, UsageMetric>;
  enforced: boolean;
}

export interface SubscriptionOverview {
  subscription: Subscription | null;
  plan_code: string;
  plan_name: string;
  limits: Record<string, number | null>;
  usage: UsageSnapshot;
}

export interface Portal {
  url: string;
  provider: string;
  is_mock: boolean;
}

export interface Payment {
  id: UUID;
  organization_id: UUID;
  subscription_id: UUID | null;
  provider: string;
  external_id: string;
  status: string;
  amount_minor: number;
  amount: string;
  currency: string;
  description: string | null;
  receipt_url: string | null;
  failure_reason: string | null;
  paid_at: ISODate | null;
  created_at: ISODate;
}

/* --------------------------------------- Jobs ------------------------------------- */

export type JobStatus = "queued" | "running" | "succeeded" | "dead" | "cancelled";

export interface Job {
  id: UUID;
  kind: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  run_at: ISODate;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  result: Record<string, unknown> | null;
  organization_id: UUID | null;
  started_at: ISODate | null;
  finished_at: ISODate | null;
  created_at: ISODate;
}

export interface JobFilters extends PageParams {
  status?: JobStatus;
  kind?: string;
}

/* --------------------------------------- Audit ------------------------------------ */

export interface AuditEvent {
  id: UUID;
  organization_id: UUID | null;
  actor_user_id: UUID | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  event_metadata: Record<string, unknown> | null;
  created_at: ISODate;
}

export interface AuditFilters extends PageParams {
  action?: string;
  actor_user_id?: string;
}
