import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Linking GitHub",
  description: "Finishing the GitHub App installation and linking it to your workspace.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
