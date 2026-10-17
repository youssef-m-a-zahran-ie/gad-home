import "server-only";
import { redirect } from "next/navigation";
import { currentAdminEmail } from "./session";

/** Returns the signed-in admin, or null. */
export async function getAdmin() {
  const email = await currentAdminEmail();
  return email ? { user: { email } } : null;
}

/** For pages and layouts: sends anyone who isn't an admin to the login page. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login?denied=1");
  return admin;
}

export class NotAdminError extends Error {
  constructor() {
    super("انتهت الجلسة. سجّل دخول تاني.");
  }
}

/** For server actions: throws when the caller isn't an admin. Every action must call this. */
export async function assertAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new NotAdminError();
  return admin;
}
