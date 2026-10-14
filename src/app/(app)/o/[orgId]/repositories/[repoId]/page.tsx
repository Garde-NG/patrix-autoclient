import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Repository",
  description: "Detected integrations, findings and scan history for a connected repository.",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ repoId: string }> }) {
  return <View params={params} />;
}
