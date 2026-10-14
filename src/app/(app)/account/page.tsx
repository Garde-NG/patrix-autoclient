import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Account",
  description: "Your profile, appearance preference and password.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
