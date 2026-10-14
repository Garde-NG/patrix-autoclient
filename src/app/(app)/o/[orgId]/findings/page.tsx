import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Findings",
  description: "Actionable items from detected API changes, mapped to the code that uses them. Acknowledge, dismiss or request a repair.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
