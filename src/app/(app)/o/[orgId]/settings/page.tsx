import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Workspace name, members and invitations, GitHub installations and the audit trail.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <View />;
}
