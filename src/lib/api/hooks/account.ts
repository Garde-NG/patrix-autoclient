"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { api } from "../client";
import { qk } from "../keys";
import type { User } from "@/lib/auth/types";

export function useMe(initialData?: User) {
  return useQuery({ queryKey: qk.me, queryFn: () => api.get<User>("auth/me"), initialData, staleTime: 5 * 60_000 });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) => api.post("auth/change-password", body),
    // Upstream revokes every session on success; take the browser to the sign-in page cleanly.
    onSuccess: () => signOut({ callbackUrl: "/login?reason=password-changed" }),
    meta: { silent: true },
  });
}

export function useSignOut() {
  return useMutation({ mutationFn: () => signOut({ callbackUrl: "/login" }) });
}
