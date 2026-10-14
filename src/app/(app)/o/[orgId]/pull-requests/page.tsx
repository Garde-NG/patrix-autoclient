import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Pull requests",
  description: "Pull requests AutoAPI opened for verified repairs. Your team reviews and merges; AutoAPI never does.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
