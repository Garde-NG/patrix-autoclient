"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { ApiError } from "@/lib/api/client";
import { ToastProvider, toast } from "@/components/ui/toast";

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Background refetch failures on data the user already sees should not shout.
        if (query.state.data !== undefined && !(error instanceof ApiError && error.isSessionExpired)) {
          toast.error(error instanceof Error ? error.message : "Couldn't refresh data.");
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.options.meta?.silent) return;
        if (error instanceof ApiError && (error.isSessionExpired || Object.keys(error.fields).length)) return;
        toast.error(error instanceof Error ? error.message : "The action failed. Please try again.");
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (count, error) => {
          if (error instanceof ApiError && error.status > 0 && error.status < 500) return false;
          return count < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: { retry: false },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  // One client per browser tab; created lazily so SSR never shares state across requests.
  const [client] = useState(makeQueryClient);
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
        {process.env.NODE_ENV === "development" ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> : null}
      </QueryClientProvider>
    </SessionProvider>
  );
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { silent?: boolean };
  }
}
