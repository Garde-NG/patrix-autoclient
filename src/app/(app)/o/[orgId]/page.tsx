import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Overview",
  description: "What changed in the APIs your code depends on: breaking findings, recent changes, repairs in flight and plan usage.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
