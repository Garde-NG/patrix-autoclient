import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "API sources",
  description: "The OpenAPI documents AutoAPI watches. Each distinct version becomes a snapshot; consecutive snapshots are diffed.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
