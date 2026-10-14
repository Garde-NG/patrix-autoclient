"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthPanel, FormError } from "@/components/auth/auth-panel";
import { useCredentialsSignIn } from "@/components/auth/use-credentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { safeReturnPath } from "@/lib/utils";

const REASONS: Record<string, string> = {
  expired: "Your session ended. Sign in to continue where you left off.",
  "password-changed": "Your password was changed. Sign in with the new one.",
  forbidden: "You don't have access to that. Sign in with a different account.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeReturnPath(params.get("next"));
  const reason = params.get("reason");
  const signIn = useCredentialsSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    signIn.mutate({ mode: "login", email, password }, { onSuccess: () => router.replace(next) });
  };

  return (
    <AuthPanel
      title="Sign in"
      description="Welcome back. Pick up where your APIs left off."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {reason && REASONS[reason] ? (
          <p role="status" className="t-footnote rounded-[10px] bg-accent-soft px-3.5 py-2.5 text-accent">
            {REASONS[reason]}
          </p>
        ) : null}
        <FormError message={signIn.error?.message ?? null} />
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" size="lg" loading={signIn.isPending} className="mt-1 w-full">
          Sign in
        </Button>
      </form>
    </AuthPanel>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
