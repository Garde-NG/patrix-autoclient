"use client";

import { useMutation } from "@tanstack/react-query";
import { signIn, getSession } from "next-auth/react";

/** Signs in through NextAuth and waits for the session so the next navigation is authenticated. */
export function useCredentialsSignIn() {
  return useMutation({
    mutationFn: async (fields: Record<string, string>) => {
      const result = await signIn("credentials", { ...fields, redirect: false });
      if (!result || result.error) throw new Error(result?.error || "Sign-in failed. Please try again.");
      const session = await getSession();
      if (!session?.user) throw new Error("Signed in, but the session could not be loaded. Please try again.");
      return session;
    },
    meta: { silent: true },
  });
}
