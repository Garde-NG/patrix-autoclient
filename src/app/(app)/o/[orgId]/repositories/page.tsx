import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Repositories",
  description: "Connected repositories, scanned for the third-party APIs and SDKs they use so changes can be mapped to your code.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
