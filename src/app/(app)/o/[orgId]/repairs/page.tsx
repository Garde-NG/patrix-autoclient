import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Repairs",
  description: "Bounded AI repairs: the agent sees only the affected files, and every patch is verified in a sandbox before it can become a pull request.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
