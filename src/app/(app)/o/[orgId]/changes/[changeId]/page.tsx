import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "API change",
  description: "One change between two API snapshots, with the raw diff entry kept as evidence and the findings it raised.",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ changeId: string }> }) {
  return <View params={params} />;
}
