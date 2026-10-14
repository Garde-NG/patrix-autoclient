"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GithubIcon } from "@/components/icons";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { useCompleteGitHubSetup } from "@/lib/api/hooks/github";

/**
 * GitHub sends people here after they install the app (the app's "Setup URL"), with
 * `installation_id` and the signed `state` we put on the install link. We finish the link and
 * drop them straight into connecting a repository.
 */
function Setup() {
  const params = useSearchParams();
  const router = useRouter();
  const installationId = Number(params.get("installation_id"));
  const state = params.get("state") ?? "";
  const action = params.get("setup_action");
  const complete = useCompleteGitHubSetup();
  const usable = Number.isInteger(installationId) && installationId > 0 && !!state;

  useEffect(() => {
    if (!usable || !complete.isIdle) return;
    complete.mutate(
      { installation_id: installationId, state },
      {
        onSuccess: (r) => {
          toast.success(r.already_linked ? "GitHub already linked" : "GitHub linked", `${r.installation.account_login} is connected to your workspace.`);
          router.replace(`/o/${r.organization_id}/repositories?connect=1`);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usable]);

  const Icon = ({ className }: { className?: string }) => <GithubIcon className={className} />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <header className="flex h-16 items-center">
        <Wordmark />
      </header>
      <main className="flex flex-1 items-center justify-center pb-16">
        {!usable ? (
          <EmptyState
            icon={Icon}
            title="Nothing to finish here"
            description={action === "request" ? "Your installation request was sent to the GitHub organization owners. Once they approve it, install the app again from Settings to link it." : "Open this page from GitHub's post-install redirect, or link the installation from Settings → GitHub."}
            action={
              <Link href="/orgs">
                <Button variant="secondary">Go to workspaces</Button>
              </Link>
            }
          />
        ) : complete.isError ? (
          <EmptyState
            icon={Icon}
            title="Couldn't link the installation"
            description={complete.error.message}
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => complete.mutate({ installation_id: installationId, state })}>
                  Try again
                </Button>
                <Link href="/orgs">
                  <Button variant="ghost">Workspaces</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <EmptyState icon={Icon} title="Linking GitHub…" description="One moment while we connect the installation to your workspace." />
        )}
      </main>
    </div>
  );
}

export default function GitHubSetupPage() {
  return (
    <Suspense>
      <Setup />
    </Suspense>
  );
}
