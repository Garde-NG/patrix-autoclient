import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "API source",
  description: "Snapshots, diff runs and detected changes for a monitored API, with polling status and credentials.",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ sourceId: string }> }) {
  return <View params={params} />;
}
