import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Workspaces",
  description: "Choose or create a workspace. Each workspace has its own repositories, API sources, findings and plan.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
