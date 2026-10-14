"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthPanel, FormError } from "@/components/auth/auth-panel";
import { useCredentialsSignIn } from "@/components/auth/use-credentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export default function SignupPage() {
  const router = useRouter();
  const signIn = useCredentialsSignIn();
  const [form, setForm] = useState({ name: "", email: "", password: "", organization_name: "" });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const passwordTooShort = form.password.length > 0 && form.password.length < 10;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordTooShort) return;
    signIn.mutate({ mode: "signup", ...form }, { onSuccess: () => router.replace("/orgs?auto=1") });
  };

  return (
    <AuthPanel
      title="Create your account"
      description="A personal workspace comes with it. Invite your team later."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormError message={signIn.error?.message ?? null} />
        <Input label="Your name" name="name" autoComplete="name" required value={form.name} onChange={set("name")} autoFocus />
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={form.email}
          onChange={set("email")}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={form.password}
          onChange={set("password")}
          hint="At least 10 characters."
          error={passwordTooShort ? "Use at least 10 characters." : null}
        />
        <Input
          label="Workspace name"
          name="organization_name"
          autoComplete="organization"
          value={form.organization_name}
          onChange={set("organization_name")}
          placeholder={form.name ? `${form.name}'s workspace` : "Optional"}
          hint="You can rename it any time."
        />
        <Button type="submit" size="lg" loading={signIn.isPending} className="mt-1 w-full">
          Create account
        </Button>
        <p className="t-caption text-center text-text-3">AutoAPI opens pull requests for review and never merges or deploys on its own.</p>
      </form>
    </AuthPanel>
  );
}
