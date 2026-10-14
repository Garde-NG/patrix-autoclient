import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Breaking changes, repair outcomes and billing events for this workspace.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
