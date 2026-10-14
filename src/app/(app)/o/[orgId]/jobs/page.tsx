import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Background work for this workspace: fetches, diffs, scans, repairs and deliveries.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
