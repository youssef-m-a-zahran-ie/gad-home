import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/guard";
import { LoginPanel } from "./login-panel";

export const metadata: Metadata = { title: "دخول الأدمن" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");
  const sp = await searchParams;
  const notice = sp.denied ? "سجّل دخول بحساب الأدمن." : null;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-[440px] gap-6">
        <p className="text-center text-[30px] font-extrabold text-navy" dir="ltr">GAD Home</p>
        <LoginPanel notice={notice} />
      </div>
    </main>
  );
}
