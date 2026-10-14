import type { Metadata } from "next";
import View from "./view";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free AutoAPI account and workspace. Connect a repository, watch the APIs it depends on, and get verified repairs as pull requests.",
};

export default function Page() {
  return <View />;
}
