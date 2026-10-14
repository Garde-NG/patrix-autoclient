import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Repair",
  description: "Attempts, patch, verification checks and delivery status for an AI repair.",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: Promise<{ jobId: string }> }) {
  return <View params={params} />;
}
