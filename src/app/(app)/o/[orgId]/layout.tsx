import type { ReactNode } from "react";
import { OrgProvider } from "@/components/shell/org-provider";
import { Sidebar } from "@/components/shell/sidebar";
import { TabBar } from "@/components/shell/tab-bar";
import { TopBar } from "@/components/shell/top-bar";

export default async function OrgLayout({ children, params }: { children: ReactNode; params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return (
    <OrgProvider orgId={orgId}>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 overflow-x-clip px-4 pb-[calc(58px+env(safe-area-inset-bottom)+24px)] pt-5 sm:px-6 sm:pt-7 lg:pb-12">{children}</main>
        </div>
      </div>
      <TabBar />
    </OrgProvider>
  );
}
