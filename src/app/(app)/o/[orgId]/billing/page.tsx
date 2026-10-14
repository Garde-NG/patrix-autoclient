import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Plan & billing",
  description: "Plans priced in your currency with the provider that serves it, usage against limits, and payment history.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
