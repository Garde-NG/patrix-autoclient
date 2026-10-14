"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import { qk } from "../keys";
import type { Checkout, CheckoutCreate, Paginated, Payment, PlanCatalogue, Portal, Subscription, SubscriptionOverview, UsageSnapshot } from "../types";

export function usePublicPlans(currency?: string) {
  return useQuery({
    queryKey: qk.plans(currency),
    queryFn: () => api.get<PlanCatalogue>("billing/plans", { currency }),
    staleTime: 10 * 60_000,
  });
}

export function useOrgPlans(orgId: string, currency?: string) {
  return useQuery({
    queryKey: qk.orgPlans(orgId, currency),
    queryFn: () => api.get<PlanCatalogue>(`orgs/${orgId}/billing/plans`, { currency }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useSubscription(orgId: string) {
  return useQuery({
    queryKey: qk.subscription(orgId),
    queryFn: () => api.get<SubscriptionOverview>(`orgs/${orgId}/billing/subscription`),
  });
}

export function useUsage(orgId: string) {
  return useQuery({ queryKey: qk.usage(orgId), queryFn: () => api.get<UsageSnapshot>(`orgs/${orgId}/usage`), staleTime: 60_000 });
}

export function useCreateCheckout(orgId: string) {
  return useMutation({
    mutationFn: (body: CheckoutCreate) => api.post<Checkout>(`orgs/${orgId}/billing/checkout`, body),
  });
}

export function useCheckout(orgId: string, checkoutId: string | null) {
  return useQuery({
    queryKey: qk.checkout(orgId, checkoutId ?? ""),
    queryFn: () => api.get<Checkout>(`orgs/${orgId}/billing/checkout/${checkoutId}`),
    enabled: !!checkoutId,
  });
}

export function useSyncCheckout(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (checkoutId: string) => api.post<Checkout>(`orgs/${orgId}/billing/checkout/${checkoutId}/sync`),
    onSuccess: (checkout) => {
      qc.setQueryData(qk.checkout(orgId, checkout.id), checkout);
      qc.invalidateQueries({ queryKey: qk.billing(orgId) });
      qc.invalidateQueries({ queryKey: qk.orgDetail(orgId) });
      qc.invalidateQueries({ queryKey: qk.orgs });
    },
  });
}

export function useCancelSubscription(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (at_period_end: boolean) => api.post<Subscription>(`orgs/${orgId}/billing/subscription/cancel`, { at_period_end }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.billing(orgId) });
      qc.invalidateQueries({ queryKey: qk.orgDetail(orgId) });
      qc.invalidateQueries({ queryKey: qk.orgs });
    },
  });
}

export function useBillingPortal(orgId: string) {
  return useMutation({
    mutationFn: (return_url?: string) => api.get<Portal>(`orgs/${orgId}/billing/portal`, { return_url }),
  });
}

export function usePayments(orgId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: qk.payments(orgId, page),
    queryFn: ({ signal }) => api.get<Paginated<Payment>>(`orgs/${orgId}/billing/payments`, { page, page_size: 20 }, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}
