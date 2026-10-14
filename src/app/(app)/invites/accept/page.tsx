import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Join a workspace you were invited to.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
