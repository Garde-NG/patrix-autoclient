import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Every third-party SDK and API detected across your repositories, with evidence and confidence.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
