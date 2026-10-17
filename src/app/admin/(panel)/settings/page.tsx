import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { one, query } from "@/lib/db";
import type { BannerRow, SettingsRow } from "@/lib/types";
import { PageHead } from "@/components/admin/ui";
import { signOut } from "../../login/actions";
import { Admins, Banners, PasswordForm, SettingsForm } from "./forms";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const { user } = await requireAdmin();
  const [s, banners, admins] = await Promise.all([
    one<SettingsRow>("select * from settings where id = 1"),
    query<BannerRow>("select * from banners order by sort"),
    query<{ email: string }>("select email from admins order by created_at"),
  ]);
  if (!s) throw new Error("settings row is missing");
  return (
    <div className="grid gap-6">
      <PageHead title="الإعدادات" />
      <SettingsForm s={s} />
      <Banners banners={banners} />
      <Admins emails={admins.map((a) => a.email)} me={user.email.toLowerCase()} />
      <PasswordForm />
      <form action={signOut}>
        <button type="submit" className="btn btn-danger">تسجيل خروج</button>
      </form>
    </div>
  );
}
