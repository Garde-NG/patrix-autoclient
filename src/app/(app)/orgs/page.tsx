"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Plus, UserRound } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { useUser } from "@/components/shell/user-provider";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListGroup } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { ListSkeleton } from "@/components/ui/skeleton";
import { ApiError, messageOf } from "@/lib/api/client";
import { useSignOut } from "@/lib/api/hooks/account";
import { useCreateOrg, useOrgs } from "@/lib/api/hooks/orgs";
import { humanize } from "@/lib/utils";

const LAST_ORG_KEY = "autoapi.lastOrg";

export function rememberOrg(orgId: string) {
  try {
    localStorage.setItem(LAST_ORG_KEY, orgId);
  } catch {}
}

export default function OrgsPage() {
  const user = useUser();
  const router = useRouter();
  const orgs = useOrgs();
  const signOut = useSignOut();
  const [creating, setCreating] = useState(false);

  // One workspace and nothing else to choose: go straight in. Returning users land on their last one.
  useEffect(() => {
    if (!orgs.data) return;
    if (orgs.data.length === 1) router.replace(`/o/${orgs.data[0].id}`);
  }, [orgs.data, router]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-16 sm:px-6">
      <header className="flex h-16 items-center justify-between">
        <Wordmark />
        <Link href="/account" className="pressable flex size-11 items-center justify-center rounded-full hover:bg-fill" aria-label="Account">
          <UserRound className="size-5 text-text-2" />
        </Link>
      </header>

      <main className="flex-1 pt-6 sm:pt-12">
        <div className="mb-6 flex items-center gap-3">
          <Avatar name={user.name} seed={user.id} size="lg" />
          <div className="min-w-0">
            <p className="t-footnote text-text-2">Signed in as</p>
            <p className="t-headline truncate text-text">{user.name}</p>
          </div>
        </div>
        <div className="mb-3 flex items-end justify-between px-1">
          <h1 className="t-title text-text">Workspaces</h1>
          <Button variant="tinted" size="sm" leading={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            New
          </Button>
        </div>

        {orgs.isPending ? (
          <ListSkeleton rows={3} />
        ) : orgs.isError ? (
          <ErrorState message={messageOf(orgs.error)} onRetry={() => orgs.refetch()} />
        ) : orgs.data.length === 0 ? (
          <EmptyState
            title="No workspaces yet"
            description="Create one to start connecting repositories and API sources."
            action={<Button onClick={() => setCreating(true)}>Create a workspace</Button>}
          />
        ) : (
          <ListGroup>
            {orgs.data.map((org, i) => (
              <Link
                key={org.id}
                href={`/o/${org.id}`}
                onClick={() => rememberOrg(org.id)}
                className="pressable-row rise-in flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <Avatar name={org.name} seed={org.id} />
                <div className="min-w-0 flex-1">
                  <p className="t-body truncate font-medium text-text">{org.name}</p>
                  <p className="t-footnote truncate text-text-2">
                    {humanize(org.plan_code)} plan · {org.slug}
                  </p>
                </div>
                <RoleBadge role={org.role} />
                <ChevronRight className="size-4 text-text-3" aria-hidden />
              </Link>
            ))}
          </ListGroup>
        )}

        <div className="mt-8 flex justify-center">
          <Button variant="ghost" size="sm" leading={<LogOut className="size-4" />} onClick={() => signOut.mutate()} loading={signOut.isPending}>
            Sign out
          </Button>
        </div>
      </main>

      <CreateOrgSheet open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function CreateOrgSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const create = useCreateOrg();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const fields = create.error instanceof ApiError ? create.error.fields : {};

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      { name: name.trim(), ...(slug.trim() ? { slug: slug.trim() } : {}) },
      {
        onSuccess: (org) => {
          rememberOrg(org.id);
          onClose();
          router.push(`/o/${org.id}`);
        },
      },
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title="New workspace" description="You'll be its owner. Invite teammates from Settings.">
      <form id="create-org" onSubmit={submit} className="flex flex-col gap-4 pb-2">
        {create.error && !Object.keys(fields).length ? (
          <p role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">
            {create.error.message}
          </p>
        ) : null}
        <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={fields.name} autoFocus maxLength={120} />
        <Input
          label="URL slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          error={fields.slug}
          hint="Optional. Lowercase letters, numbers and hyphens."
          pattern="^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
          minLength={3}
          maxLength={80}
        />
        <Button type="submit" size="lg" loading={create.isPending} disabled={!name.trim()} className="mt-2">
          Create workspace
        </Button>
      </form>
    </Sheet>
  );
}
