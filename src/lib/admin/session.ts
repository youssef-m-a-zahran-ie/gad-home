import "server-only";
import { cookies } from "next/headers";
import { one, query } from "@/lib/db";

export const SESSION_COOKIE = "gad_admin";
const DAYS = 14;

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Starts a session for an admin email and sets the HttpOnly cookie. Only the token's hash is stored. */
export async function startSession(email: string) {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = [...raw].map((b) => b.toString(16).padStart(2, "0")).join("");
  await query(
    "insert into admin_sessions (token_hash, email, expires_at) values ($1, $2, now() + make_interval(days => $3))",
    [await sha256(token), email, DAYS],
  );
  // Housekeeping: drop expired sessions.
  await query("delete from admin_sessions where expires_at < now()");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DAYS * 24 * 3600,
  });
}

/** The email of the signed-in admin, or null. Checks the DB, so removing an admin signs them out at once. */
export async function currentAdminEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await one<{ email: string }>(
    `select s.email from admin_sessions s join admins a on a.email = s.email
     where s.token_hash = $1 and s.expires_at > now()`,
    [await sha256(token)],
  );
  return row?.email ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query("delete from admin_sessions where token_hash = $1", [await sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

/** Signs out every session of an email, except optionally the one with `keepToken`. */
export async function endAllSessions(email: string) {
  await query("delete from admin_sessions where email = $1", [email]);
}
