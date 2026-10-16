import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOut } from "../login/actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await requireAdmin();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new");
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="no-print border-b border-line bg-white px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-l lg:py-6">
        <div className="mb-3 flex items-center justify-between gap-2 lg:mb-6 lg:block">
          <Link href="/admin" className="text-[24px] font-extrabold text-navy" dir="ltr">
            GAD Home
          </Link>
          <div className="flex items-center gap-2 lg:mt-2">
            <Link href="/" target="_blank" className="text-[16px] font-bold text-blue hover:underline">
              شوف الموقع ↗
            </Link>
          </div>
        </div>
        <AdminNav newOrders={count ?? 0} />
        <div className="mt-6 hidden border-t border-line pt-4 lg:block">
          <p className="truncate text-[15px] text-muted" dir="ltr">{user.email}</p>
          <form action={signOut}>
            <button type="submit" className="mt-2 text-[17px] font-bold text-sale hover:underline">
              تسجيل خروج
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 pt-6 pb-16 lg:px-10 lg:pt-8">
        <div className="mx-auto max-w-[1150px]">{children}</div>
      </main>
    </div>
  );
}
