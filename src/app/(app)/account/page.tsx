"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { useUser } from "@/components/shell/user-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, KeyValue, ListGroup } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { useChangePassword, useSignOut } from "@/lib/api/hooks/account";
import { formatDateTime } from "@/lib/utils";

export default function AccountPage() {
  const user = useUser();
  const signOut = useSignOut();
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const fields = change.error instanceof ApiError ? change.error.fields : {};
  const mismatch = confirm.length > 0 && confirm !== next;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mismatch || next.length < 10) return;
    change.mutate({ current_password: current, new_password: next });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-16 sm:px-6">
      <header className="flex h-16 items-center">
        <Wordmark />
      </header>
      <main className="flex-1 pt-4">
        <Link href="/orgs" className="pressable mb-4 inline-flex items-center gap-0.5 text-[15px] text-accent hover:underline">
          <ChevronLeft className="size-4" /> Workspaces
        </Link>
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user.name} seed={user.id} size="lg" />
          <div className="min-w-0">
            <h1 className="t-title truncate text-text">{user.name}</h1>
            <p className="t-body truncate text-text-2">{user.email}</p>
          </div>
        </div>

        <ListGroup className="mb-6">
          <dl className="divide-y divide-separator">
            <KeyValue label="Email" value={user.email} />
            <KeyValue label="Member since" value={formatDateTime(user.created_at)} />
            <KeyValue label="Last sign-in" value={formatDateTime(user.last_login_at)} />
          </dl>
        </ListGroup>

        <Card className="mb-6">
          <CardHeader title="Change password" description="Every signed-in device will be signed out, including this one." />
          <CardBody>
            <form onSubmit={submit} className="flex flex-col gap-4">
              {change.error && !Object.keys(fields).length ? (
                <p role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">
                  {change.error.message}
                </p>
              ) : null}
              <Input label="Current password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} error={fields.current_password} />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                hint="At least 10 characters."
                error={fields.new_password ?? (next.length > 0 && next.length < 10 ? "Use at least 10 characters." : null)}
              />
              <Input label="Confirm new password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} error={mismatch ? "Passwords don't match." : null} />
              <div className="flex justify-end">
                <Button type="submit" loading={change.isPending} disabled={!current || next.length < 10 || mismatch}>
                  Update password
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="flex justify-center">
          <Button variant="danger-tinted" onClick={() => signOut.mutate()} loading={signOut.isPending}>
            Sign out
          </Button>
        </div>
      </main>
    </div>
  );
}
