"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { one, query } from "@/lib/db";
import { endSession, startSession } from "@/lib/admin/session";
import { fail, type ActionState } from "@/lib/admin/state";
import { str } from "@/lib/admin/form";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FAILS = 8; // per email, per 15 minutes

async function clientIp() {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

async function tooManyTries(email: string) {
  const r = await one<{ n: number }>(
    "select count(*)::int as n from login_attempts where email = $1 and not ok and created_at > now() - interval '15 minutes'",
    [email],
  );
  return (r?.n ?? 0) >= MAX_FAILS;
}

async function log(email: string, ok: boolean) {
  await query("insert into login_attempts (email, ip, ok) values ($1, $2, $3)", [email, await clientIp(), ok]);
  await query("delete from login_attempts where created_at < now() - interval '7 days'");
}

export async function signIn(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!EMAIL_RE.test(email)) return fail("اكتب الإيميل صح.", { email: "اكتب الإيميل صح." });
  if (!password) return fail("اكتب الباسورد.", { password: "اكتب الباسورد." });
  if (await tooManyTries(email)) return fail("محاولات كتير غلط. استنى ١٥ دقيقة وجرب تاني.");

  const row = await one<{ email: string }>(
    "select email from admins where email = $1 and password_hash is not null and password_hash = crypt($2, password_hash)",
    [email, password],
  );
  await log(email, Boolean(row));
  if (!row) return fail("الإيميل أو الباسورد غلط.");
  await startSession(row.email);
  redirect("/admin");
}

/** First-time setup for an email that's in the admin list but has no password yet. Needs the setup code. */
export async function createAdminAccount(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const confirm = str(fd, "confirm");
  const code = str(fd, "code");
  if (!EMAIL_RE.test(email)) return fail("اكتب الإيميل صح.", { email: "اكتب الإيميل صح." });
  if (password.length < 8) return fail("الباسورد ٨ حروف أو أرقام على الأقل.", { password: "٨ حروف أو أرقام على الأقل." });
  if (password !== confirm) return fail("الباسوردين مش زي بعض.", { confirm: "مش زي الأول." });
  const expected = process.env.ADMIN_SETUP_CODE;
  if (!expected) return fail("إنشاء الحساب مقفول. اطلب من أدمن تاني يضيفك بباسورد.");
  if (await tooManyTries(email)) return fail("محاولات كتير غلط. استنى ١٥ دقيقة وجرب تاني.");
  if (code !== expected) {
    await log(email, false);
    return fail("كود الإعداد غلط.", { code: "غلط." });
  }
  const row = await one<{ email: string }>(
    "update admins set password_hash = crypt($2, gen_salt('bf', 10)) where email = $1 and password_hash is null returning email",
    [email, password],
  );
  if (!row) return fail("الإيميل ده مش في قائمة الأدمن، أو عنده باسورد بالفعل. سجّل دخول.");
  await log(email, true);
  await startSession(row.email);
  redirect("/admin");
}

export async function signOut() {
  await endSession();
  redirect("/admin/login");
}
