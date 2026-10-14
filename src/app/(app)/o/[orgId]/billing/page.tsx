"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CreditCard, ExternalLink, Receipt, Sparkles } from "lucide-react";
import { useOrgContext } from "@/components/shell/org-provider";
import { Badge, MockBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, ListGroup, Row } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { PageHeader, Section } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { CardSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { ListShell } from "@/components/shared/list-shell";
import { useBillingPortal, useCancelSubscription, useCreateCheckout, useOrgPlans, usePayments, useSubscription, useSyncCheckout } from "@/lib/api/hooks/billing";
import type { BillingProvider, Plan, PlanPrice } from "@/lib/api/types";
import { cn, formatDateTime, formatNumber, humanize } from "@/lib/utils";

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", GHS: "GH₵", KES: "KSh", ZAR: "R" };

function guessCurrency(available: string[]): string {
  try {
    const lang = navigator.language.toUpperCase();
    const map: Record<string, string> = { NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR", GB: "GBP", US: "USD" };
    for (const [region, cur] of Object.entries(map)) if (lang.endsWith(`-${region}`) && available.includes(cur)) return cur;
    if (/-(DE|FR|ES|IT|NL|IE|PT|AT|BE|FI)$/.test(lang) && available.includes("EUR")) return "EUR";
  } catch {}
  return available.includes("USD") ? "USD" : available[0] ?? "USD";
}

export default function BillingPage() {
  return (
    <Suspense>
      <Billing />
    </Suspense>
  );
}

function Billing() {
  const { orgId, isOwner, isAdmin } = useOrgContext();
  const sub = useSubscription(orgId);
  // All currencies come down once; the chosen currency only filters client-side, so switching is instant.
  const plans = useOrgPlans(orgId);
  const [chosenCurrency, setCurrency] = useState<string | null>(null);
  const currency = chosenCurrency ?? (plans.data ? guessCurrency(plans.data.currencies) : undefined);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [selected, setSelected] = useState<{ plan: Plan; price: PlanPrice } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancel = useCancelSubscription(orgId);
  const portal = useBillingPortal(orgId);

  const overview = sub.data;
  const current = overview?.subscription;

  return (
    <>
      <CheckoutReturn orgId={orgId} />
      <PageHeader
        title="Plan & billing"
        description="Pay in your currency with the provider that serves it. Limits apply per workspace."
        actions={
          isOwner && current && !current.is_mock ? (
            <Button variant="secondary" trailing={<ExternalLink className="size-3.5" />} loading={portal.isPending} onClick={() => portal.mutate(window.location.href, { onSuccess: (p) => window.location.assign(p.url) })}>
              Manage payment method
            </Button>
          ) : null
        }
      />

      <Section>
        {sub.isPending ? (
          <CardSkeleton />
        ) : overview ? (
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 bg-[radial-gradient(80%_120%_at_0%_0%,var(--accent-soft),transparent_60%)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="t-caption font-semibold uppercase tracking-wide text-text-2">Current plan</p>
                <p className="t-title mt-0.5 flex items-center gap-2 text-text">
                  {overview.plan_name}
                  {current ? <StatusBadge status={current.status} /> : <Badge>Free</Badge>}
                  <MockBadge show={current?.is_mock} />
                </p>
                {current ? (
                  <p className="t-footnote mt-1 text-text-2">
                    {current.amount ? `${CURRENCY_SYMBOL[current.currency ?? ""] ?? current.currency} ${current.amount} / ${current.interval}` : ""}
                    {current.current_period_end ? ` · ${current.cancel_at_period_end ? "ends" : "renews"} ${formatDateTime(current.current_period_end)}` : ""}
                    {current.provider ? ` · via ${humanize(current.provider)}` : ""}
                  </p>
                ) : (
                  <p className="t-footnote mt-1 text-text-2">Upgrade for more repositories, members and monthly scans.</p>
                )}
              </div>
              {isOwner && current && current.status !== "cancelled" && !current.cancel_at_period_end ? (
                <Button variant="danger-tinted" size="sm" onClick={() => setCancelOpen(true)}>
                  Cancel subscription
                </Button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 divide-separator border-t border-separator sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(overview.usage.metrics).map(([key, m]) => {
                const pct = m.limit ? Math.min(100, Math.round((m.used / m.limit) * 100)) : 0;
                return (
                  <div key={key} className="border-b border-r border-separator p-4 last:border-r-0 sm:border-b-0">
                    <p className="t-caption text-text-2">{humanize(key.replace("_per_month", ""))}{m.period === "month" ? " / mo" : ""}</p>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums tracking-tight text-text">
                      {formatNumber(m.used)}
                      <span className="t-footnote text-text-3"> / {m.limit === null ? "∞" : formatNumber(m.limit)}</span>
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-fill">
                      <div className={cn("h-full rounded-full", pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-accent")} style={{ width: `${m.limit ? pct : 6}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {!overview.usage.enforced ? <p className="t-caption border-t border-separator px-5 py-2 text-text-3">Limits are not enforced on this server.</p> : null}
          </Card>
        ) : null}
      </Section>

      <Section
        title="Plans"
        action={
          <div className="flex items-center gap-2">
            <Segmented ariaLabel="Billing interval" value={interval} onChange={setInterval} options={[{ value: "month", label: "Monthly" }, { value: "year", label: "Yearly" }]} />
            {plans.data?.currencies.length ? (
              <Select value={currency ?? ""} onChange={(e) => setCurrency(e.target.value)} wrapperClassName="w-24" className="h-9 text-[13px]" aria-label="Currency">
                {plans.data.currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            ) : null}
          </div>
        }
      >
        {plans.isPending ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : plans.data ? (
          <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-4", plans.isPlaceholderData && "opacity-60")}>
            {plans.data.plans.map((plan) => {
              const price = plan.prices.find((p) => p.interval === interval && (!currency || p.currency === currency)) ?? plan.prices.find((p) => p.interval === interval);
              const isCurrent = plan.code === (plans.data?.current_plan_code ?? overview?.plan_code);
              const highlight = plan.code === "pro";
              return (
                <Card key={plan.code} className={cn("flex flex-col p-5", highlight && "border-accent/40 shadow-2", isCurrent && "ring-2 ring-accent/30")}>
                  <div className="flex items-center justify-between">
                    <h3 className="t-headline text-text">{plan.name}</h3>
                    {isCurrent ? <Badge tone="accent">Current</Badge> : highlight ? <Badge tone="purple"><Sparkles className="mr-1 size-3" />Popular</Badge> : null}
                  </div>
                  <p className="t-footnote mt-1 min-h-10 text-text-2">{plan.description}</p>
                  <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.02em] text-text">
                    {plan.is_self_serve ? (
                      price ? (
                        <>
                          <span className="t-body align-top text-text-2">{CURRENCY_SYMBOL[price.currency] ?? `${price.currency} `}</span>
                          {price.amount}
                          <span className="t-footnote text-text-3"> / {interval === "year" ? "yr" : "mo"}</span>
                        </>
                      ) : plan.code === "free" ? (
                        "Free"
                      ) : (
                        <span className="t-body text-text-2">Not available in {currency}</span>
                      )
                    ) : (
                      <span className="t-title">Let&apos;s talk</span>
                    )}
                  </p>
                  {plan.trial_days ? <p className="t-caption mt-1 text-success">{plan.trial_days}-day free trial</p> : null}
                  <ul className="mt-4 flex-1 space-y-1.5">
                    {Object.entries(plan.limits ?? {}).map(([k, v]) => (
                      <li key={k} className="flex items-start gap-2 text-[13.5px] text-text">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        {v === null ? "Unlimited" : formatNumber(v as number)}{" "}
                        {(() => { const label = humanize(k.replace("_per_month", "")).toLowerCase(); return v === 1 ? label.replace(/ies$/, "y").replace(/s$/, "") : label; })()}
                        {k.includes("per_month") ? "/mo" : ""}
                      </li>
                    ))}
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13.5px] text-text">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        {typeof f === "string" ? f : JSON.stringify(f)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5">
                    {isCurrent ? (
                      <Button variant="secondary" className="w-full" disabled>
                        Your plan
                      </Button>
                    ) : !plan.is_self_serve ? (
                      <a href="mailto:sales@autoapi.dev" className="block">
                        <Button variant="secondary" className="w-full">
                          Contact sales
                        </Button>
                      </a>
                    ) : price && price.purchasable ? (
                      <Button variant={highlight ? "primary" : "tinted"} className="w-full" disabled={!isOwner} onClick={() => setSelected({ plan, price })} title={!isOwner ? "Only owners can change the plan" : undefined}>
                        {plan.code === "free" ? "Downgrade" : "Choose " + plan.name}
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full" disabled>
                        {plan.code === "free" ? "Included" : "Unavailable"}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}
        {!isOwner ? <p className="t-footnote mt-3 px-1 text-text-2">Only the workspace owner can change the plan.</p> : null}
      </Section>

      {isAdmin ? <Payments orgId={orgId} /> : null}

      <CheckoutSheet orgId={orgId} selection={selected} providers={plans.data?.providers ?? []} onClose={() => setSelected(null)} />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel your subscription?"
        description="You keep the plan until the end of the paid period, then the workspace returns to Free. Nothing is deleted."
        confirmLabel="Cancel at period end"
        variant="danger"
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate(true, { onSuccess: () => { setCancelOpen(false); toast.success("Subscription will end at the period end"); } })}
      />
    </>
  );
}

function CheckoutSheet({ orgId, selection, providers, onClose }: { orgId: string; selection: { plan: Plan; price: PlanPrice } | null; providers: BillingProvider[]; onClose: () => void }) {
  const create = useCreateCheckout(orgId);
  const options = useMemo(() => (selection ? providers.filter((p) => selection.price.providers.includes(p.key)) : []), [selection, providers]);
  const [provider, setProvider] = useState<string>("");
  const chosen = provider || options[0]?.key || "";

  const start = () => {
    if (!selection) return;
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");
    create.mutate(
      { plan_code: selection.plan.code, currency: selection.price.currency, interval: selection.price.interval, provider: chosen || undefined, success_url: `${base}/o/${orgId}/billing?checkout={CHECKOUT_ID}&status=success`, cancel_url: `${base}/o/${orgId}/billing?status=cancelled` },
      {
        onSuccess: (c) => {
          if (c.url) window.location.assign(c.url);
          else toast.error("No payment page was returned", c.error ?? undefined);
        },
      },
    );
  };

  return (
    <Sheet
      open={!!selection}
      onClose={onClose}
      title={selection ? `Switch to ${selection.plan.name}` : ""}
      description={selection ? `${CURRENCY_SYMBOL[selection.price.currency] ?? selection.price.currency} ${selection.price.amount} per ${selection.price.interval}, billed by the provider you choose. You can cancel any time.` : undefined}
      footer={
        <Button size="lg" className="w-full" leading={<CreditCard className="size-4" />} loading={create.isPending} disabled={!chosen} onClick={start}>
          Continue to payment
        </Button>
      }
    >
      <div className="space-y-3 pb-2" role="radiogroup" aria-label="Payment provider">
        {options.map((p) => {
          const active = p.key === chosen;
          return (
            <button key={p.key} type="button" role="radio" aria-checked={active} onClick={() => setProvider(p.key)} className={cn("pressable flex w-full items-start gap-3 rounded-[14px] border p-4 text-left", active ? "border-accent bg-accent-soft" : "border-separator bg-surface hover:bg-surface-2")}>
              <span className={cn("mt-0.5 size-[18px] shrink-0 rounded-full border-2", active ? "border-accent bg-accent" : "border-separator-strong")} aria-hidden>
                {active ? <span className="block size-full scale-50 rounded-full bg-white" /> : null}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[15px] font-medium text-text">
                  {p.display_name} <MockBadge show={p.is_mock} />
                </span>
                <span className="t-footnote block text-text-2">{p.note}</span>
                <span className="t-caption block text-text-3">{p.currencies.join(", ")}</span>
              </span>
            </button>
          );
        })}
        {!options.length ? <EmptyState compact title="No provider collects this currency" description="Pick another currency above." /> : null}
        {create.error ? <p role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">{create.error.message}</p> : null}
      </div>
    </Sheet>
  );
}

/** Handles the return from the hosted payment page: syncs the checkout and reports the outcome. */
function CheckoutReturn({ orgId }: { orgId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const sync = useSyncCheckout(orgId);
  const checkoutId = params.get("checkout");
  const status = params.get("status");

  useEffect(() => {
    if (!status) return;
    const clear = () => router.replace(`/o/${orgId}/billing`, { scroll: false });
    if (status === "cancelled") {
      toast.info("Checkout cancelled", "No changes were made.");
      clear();
      return;
    }
    if (checkoutId && checkoutId !== "{CHECKOUT_ID}" && sync.isIdle) {
      sync.mutate(checkoutId, {
        onSuccess: (c) => {
          if (c.status === "completed") toast.success("You're upgraded", "Thanks! Your new limits apply now.");
          else toast.info(`Checkout ${humanize(c.status)}`, c.error ?? "We'll update the plan as soon as the provider confirms the payment.");
          clear();
        },
        onError: clear,
      });
    } else if (status === "success") {
      toast.info("Payment received", "The plan updates as soon as the provider confirms it.");
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, checkoutId]);
  return null;
}

function Payments({ orgId }: { orgId: string }) {
  const [page, setPage] = useState(1);
  const query = usePayments(orgId, page);
  return (
    <Section title="Payments">
      <ListShell query={query} onPage={setPage} rows={3} empty={<EmptyState compact icon={Receipt} title="No payments yet" />}>
        {(items) => (
          <ListGroup>
            {items.map((p) => (
              <Row
                key={p.id}
                trailing={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    {p.receipt_url ? (
                      <a href={p.receipt_url} target="_blank" rel="noreferrer" className="pressable flex size-8 items-center justify-center rounded-full text-text-2 hover:bg-fill" aria-label="Receipt">
                        <ExternalLink className="size-4" />
                      </a>
                    ) : null}
                  </div>
                }
              >
                <p className="t-body font-medium tabular-nums text-text">
                  {CURRENCY_SYMBOL[p.currency] ?? `${p.currency} `}
                  {p.amount}
                </p>
                <p className="t-footnote text-text-2">
                  {p.description ?? humanize(p.provider)} · {formatDateTime(p.paid_at ?? p.created_at)}
                  {p.failure_reason ? ` · ${p.failure_reason}` : ""}
                </p>
              </Row>
            ))}
          </ListGroup>
        )}
      </ListShell>
    </Section>
  );
}

