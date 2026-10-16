import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MOCK } from "@/lib/supabase/mock";

/** Returns the signed-in admin and a Supabase client, or null. */
export async function getAdmin() {
  const supabase = await createClient();
  if (MOCK) return { supabase, user: { email: "admin@example.com" } };
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return null;
  return { supabase, user: { email: user.email ?? "" } };
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
