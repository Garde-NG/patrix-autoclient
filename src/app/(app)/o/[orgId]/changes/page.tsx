import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "API changes",
  description: "Every difference between consecutive snapshots of a monitored API, classified as breaking, warning or informational.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
