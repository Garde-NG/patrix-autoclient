import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { upstream, UpstreamError } from "@/lib/server/upstream";
import { refreshToken, tokenFromLogin } from "./refresh";
import { authSecret, SESSION_COOKIE, SESSION_MAX_AGE, sessionCookieOptions, shouldRefresh, type AppToken } from "./shared";
import type { TokenResponse } from "./types";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
  name: z.string().trim().min(1, "Enter your name.").max(120),
  organization_name: z.string().trim().max(120).optional().or(z.literal("")),
});

export const authOptions: NextAuthOptions = {
  secret: authSecret(),
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  cookies: { sessionToken: { name: SESSION_COOKIE, options: sessionCookieOptions } },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "AutoAPI",
      credentials: { mode: {}, email: {}, password: {}, name: {}, organization_name: {} },
      async authorize(credentials) {
        try {
          if (credentials?.mode === "signup") {
            const parsed = signupSchema.safeParse(credentials);
            if (!parsed.success) throw new UpstreamError(422, parsed.error.issues[0]?.message ?? "Check the form.");
            const { organization_name, ...rest } = parsed.data;
            const result = await upstream<TokenResponse>("auth/signup", {
              body: { ...rest, ...(organization_name ? { organization_name } : {}) },
            });
            return { id: result.user.id, authToken: tokenFromLogin(result) };
          }
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) throw new UpstreamError(422, parsed.error.issues[0]?.message ?? "Check the form.");
          const result = await upstream<TokenResponse>("auth/login", { body: parsed.data });
          return { id: result.user.id, authToken: tokenFromLogin(result) };
        } catch (error) {
          // NextAuth only forwards the message; upstream messages are already user-safe.
          throw new Error(error instanceof UpstreamError ? error.message : "Sign-in failed. Please try again.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.authToken) return user.authToken;
      const current = token as AppToken;
      return shouldRefresh(current) ? refreshToken(current) : current;
    },
    async session({ session, token }) {
      const current = token as AppToken;
      session.user = current.authError === "SessionExpired" ? undefined : current.user;
      session.authError = current.authError;
      session.expiresAt = current.expiresAt;
      // Access and refresh tokens never leave the server.
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      const current = token as AppToken;
      if (current.tokens) {
        await upstream("auth/logout", { body: { refresh_token: current.tokens.refresh_token } }).catch(() => undefined);
      }
    },
  },
};
