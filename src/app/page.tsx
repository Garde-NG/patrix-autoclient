import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";

export default async function IndexPage() {
  const user = await currentUser();
  redirect(user ? "/orgs" : "/login");
}
