"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/admin/origin";
import { fail, ok, type ActionState } from "@/lib/admin/state";
import { str } from "@/lib/admin/form";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!EMAIL_RE.test(email)) return fail("اكتب الإيميل صح.", { email: "اكتب الإيميل صح." });
  if (!password) return fail("اكتب الباسورد.", { password: "اكتب الباسورد." });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") return fail("الحساب لسه متأكدش. افتح اللينك اللي وصلك على الإيميل.");
    return fail("الإيميل أو الباسورد غلط.");
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return fail("الحساب ده مش أدمن.");
  }
  redirect("/admin");
}

export async function createAdminAccount(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const confirm = str(fd, "confirm");
  if (!EMAIL_RE.test(email)) return fail("اكتب الإيميل صح.", { email: "اكتب الإيميل صح." });
  if (password.length < 8) return fail("الباسورد ٨ حروف أو أرقام على الأقل.", { password: "٨ حروف أو أرقام على الأقل." });
  if (password !== confirm) return fail("الباسوردين مش زي بعض.", { confirm: "مش زي الأول." });

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("is_admin_email", { p_email: email });
  if (!allowed) return fail("الإيميل ده مش في قائمة الأدمن.");

  const origin = await requestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/admin/auth/callback?next=/admin` },
  });
  if (error) {
    if (error.code === "user_already_exists") return fail("الحساب موجود قبل كده. سجّل دخول.");
    if (error.code === "weak_password") return fail("اختار باسورد أقوى.");
    return fail(error.message);
  }
  // Admin emails are confirmed automatically by the database, so we're usually signed in already.
  if (data.session) redirect("/admin");
  return ok("الحساب اتعمل. سجّل دخول دلوقتي.");
}

export async function sendPasswordReset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return fail("اكتب الإيميل صح.", { email: "اكتب الإيميل صح." });
  const supabase = await createClient();
  const origin = await requestOrigin();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/admin/auth/callback?next=/admin/settings` });
  return ok(`لو ${email} عليه حساب أدمن، هيوصله لينك يغير منه الباسورد.`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
