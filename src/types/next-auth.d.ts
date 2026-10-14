import type { DefaultSession } from "next-auth";
import type { AppToken, AuthError } from "@/lib/auth/shared";
import type { User as AppUser } from "@/lib/auth/types";

declare module "next-auth" {
  interface Session extends Omit<DefaultSession, "user"> {
    user?: AppUser;
    authError?: AuthError;
    expiresAt?: number;
  }
  interface User {
    id: string;
    authToken: AppToken;
  }
}
