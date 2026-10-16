import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import type { BannerRow, SettingsRow } from "@/lib/supabase/database.types";
import { PageHead } from "@/components/admin/ui";
import { signOut } from "../../login/actions";
import { Admins, Banners, PasswordForm, SettingsForm } from "./forms";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const { supabase, user } = await requireAdmin();
  const [{ data: s }, { data: banners }, { data: admins }] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).single(),
    supabase.from("banners").select("*").order("sort"),
    supabase.from("admins").select("email").order("created_at"),
  ]);
  return (
    <div className="grid gap-6">
      <PageHead title="الإعدادات" />
      <SettingsForm s={s as SettingsRow} />
      <Banners banners={(banners ?? []) as BannerRow[]} />
      <Admins emails={(admins ?? []).map((a) => a.email)} me={(user.email ?? "").toLowerCase()} />
      <PasswordForm />
      <form action={signOut}>
        <button type="submit" className="btn btn-danger">تسجيل خروج</button>
      </form>
    </div>
  );
}
