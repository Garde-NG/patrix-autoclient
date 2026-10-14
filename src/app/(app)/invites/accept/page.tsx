"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAcceptInvite } from "@/lib/api/hooks/orgs";

function Accept() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();
  const accept = useAcceptInvite();

  useEffect(() => {
    if (token && accept.isIdle) accept.mutate(token, { onSuccess: (org) => router.replace(`/o/${org.id}`) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <header className="flex h-16 items-center">
        <Wordmark />
      </header>
      <main className="flex flex-1 items-center justify-center pb-16">
        {!token ? (
          <EmptyState icon={MailCheck} title="Missing invitation token" description="Open the link exactly as it was shared with you." action={<Link href="/orgs"><Button variant="secondary">Go to workspaces</Button></Link>} />
        ) : accept.isError ? (
          <EmptyState
            icon={MailCheck}
            title="This invitation can't be accepted"
            description={accept.error.message}
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => accept.mutate(token, { onSuccess: (org) => router.replace(`/o/${org.id}`) })}>
                  Try again
                </Button>
                <Link href="/orgs">
                  <Button variant="ghost">Workspaces</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <EmptyState icon={MailCheck} title="Joining the workspace…" description="One moment while we add you." />
        )}
      </main>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <Accept />
    </Suspense>
  );
}
