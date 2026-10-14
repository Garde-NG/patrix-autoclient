import "server-only";
import { cookies } from "next/headers";
import { decode, encode } from "next-auth/jwt";
import { authSecret, SESSION_COOKIE, SESSION_MAX_AGE, sessionCookieOptions, type AppToken } from "./shared";

/** Browsers cap a single cookie at 4KB; NextAuth chunks larger tokens as `name.0`, `name.1`, ... */
const CHUNK_SIZE = 3800;

export async function readAuthToken(): Promise<AppToken | null> {
  const store = await cookies();
  const chunks = store
    .getAll()
    .filter(({ name }) => name.startsWith(`${SESSION_COOKIE}.`))
    .sort((a, b) => Number(a.name.split(".").pop()) - Number(b.name.split(".").pop()));
  const value = store.get(SESSION_COOKIE)?.value || chunks.map((c) => c.value).join("");
  if (!value) return null;
  try {
    return (await decode({ token: value, secret: authSecret() })) as AppToken | null;
  } catch {
    return null;
  }
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (name === SESSION_COOKIE || name.startsWith(`${SESSION_COOKIE}.`)) {
      store.set(name, "", { ...sessionCookieOptions, maxAge: 0 });
    }
  }
}

export async function writeAuthToken(token: AppToken): Promise<void> {
  const encoded = await encode({ token, secret: authSecret(), maxAge: SESSION_MAX_AGE });
  const store = await cookies();
  await clearAuthCookie();
  const chunks = encoded.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) ?? [];
  chunks.forEach((value, index) => {
    const name = chunks.length === 1 ? SESSION_COOKIE : `${SESSION_COOKIE}.${index}`;
    store.set(name, value, { ...sessionCookieOptions, maxAge: SESSION_MAX_AGE });
  });
}
