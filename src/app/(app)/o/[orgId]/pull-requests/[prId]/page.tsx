import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Pull request",
  description: "The rendered pull request body, files changed and verification summary for a delivered repair.",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ prId: string }> }) {
  return <View params={params} />;
}
