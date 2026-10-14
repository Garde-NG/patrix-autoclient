import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Finding",
  description: "A detected API change and the code it affects, with evidence, open questions and the suggested action.",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ findingId: string }> }) {
  return <View params={params} />;
}
