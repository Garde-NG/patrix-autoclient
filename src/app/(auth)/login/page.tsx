import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to AutoAPI to see which third-party API changes affect your code, review verified repairs, and keep your integrations healthy.",
};

export default function Page() {
  return <View />;
}
