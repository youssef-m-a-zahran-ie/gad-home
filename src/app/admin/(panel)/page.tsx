import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { dateTime, egp, num } from "@/lib/format";
import type { OrderRow } from "@/lib/supabase/database.types";
import { Card, Empty, StatusBadge } from "@/components/admin/ui";

export const metadata: Metadata = { title: "الرئيسية" };

/** Midnight in Cairo, as an ISO string. */
function cairoStart(daysAgo = 0, monthStart = false) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [y, m, d] = parts.split("-").map(Number);
  // Cairo offset at this moment (handles summer time).
  const cairoNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
  const diffMs = cairoNow.getTime() - new Date(now.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const local = Date.UTC(y, m - 1, monthStart ? 1 : d - daysAgo);
  return new Date(local - diffMs).toISOString();
}

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const monthStart = cairoStart(0, true);
  const todayStart = cairoStart(0);
  const [{ data: monthOrders }, { data: latest }, { data: prods }] = await Promise.all([
    supabase.from("orders").select("total, status, created_at").gte("created_at", monthStart).limit(5000),
    supabase.from("orders").select("id, number, status, customer_name, total, created_at, governorate").order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select("id, name, stock, low_stock_at, is_active").eq("is_active", true).order("stock").limit(1000),
  ]);
  const live = (monthOrders ?? []).filter((o) => o.status !== "cancelled");
  const today = live.filter((o) => o.created_at >= todayStart);
  const sum = (a: { total: number }[]) => a.reduce((s, o) => s + Number(o.total), 0);
  const newCount = (monthOrders ?? []).filter((o) => o.status === "new").length;
  const low = (prods ?? []).filter((p) => p.stock <= p.low_stock_at);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[30px]">أهلاً 👋</h1>
        <Link href="/admin/products/new" className="btn btn-primary">+ أضف منتج</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="طلبات النهارده" value={num(today.length)} sub={egp(sum(today))} />
        <Stat label="طلبات الشهر ده" value={num(live.length)} sub={egp(sum(live))} />
        <Link href="/admin/orders?status=new" className="contents">
          <Stat label="طلبات جديدة محتاجة تأكيد" value={num(newCount)} tone={newCount ? "blue" : undefined} />
        </Link>
        <Link href="/admin/inventory?f=low" className="contents">
          <Stat label="منتجات قربت تخلص أو خلصت" value={num(low.length)} tone={low.length ? "warn" : undefined} />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px]">آخر الطلبات</h2>
            <Link href="/admin/orders" className="text-[17px] font-bold text-blue hover:underline">كل الطلبات</Link>
          </div>
          {(latest ?? []).length === 0 ? (
            <Empty text="لسه مفيش طلبات. أول ما حد يطلب هيظهر هنا." />
          ) : (
            <ul className="grid gap-2">
              {(latest as Pick<OrderRow, "id" | "number" | "status" | "customer_name" | "total" | "created_at" | "governorate">[]).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 hover:border-blue">
                    <span className="text-[19px] font-extrabold text-navy">#{o.number}</span>
                    <StatusBadge status={o.status} />
                    <span className="min-w-0 flex-1 text-[17px]">{o.customer_name} • {o.governorate}</span>
                    <span className="text-[18px] font-bold">{egp(o.total)}</span>
                    <span className="w-full text-[15px] text-muted sm:w-auto">{dateTime(o.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px]">تنبيهات المخزون</h2>
            <Link href="/admin/inventory" className="text-[17px] font-bold text-blue hover:underline">المخزون</Link>
          </div>
          {low.length === 0 ? (
            <p className="text-[17px] text-muted">كل المنتجات متوفرة 👌</p>
          ) : (
            <ul className="grid gap-2">
              {low.slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
                  <Link href={`/admin/products/${p.id}`} className="min-w-0 text-[17px] hover:text-blue">{p.name}</Link>
                  <span className={`badge ${p.stock <= 0 ? "bg-[#fdecec] text-sale" : "bg-warn-bg text-warn"}`}>{p.stock <= 0 ? "خلص" : `${p.stock} باقي`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "blue" | "warn" }) {
  return (
    <div className={`card p-4 ${tone === "blue" ? "border-2 border-blue bg-sky" : tone === "warn" ? "border-2 border-warn bg-warn-bg" : ""}`}>
      <p className="text-[15px] font-bold text-muted">{label}</p>
      <p className="text-[30px] leading-tight font-extrabold text-navy">{value}</p>
      {sub && <p className="text-[16px] font-bold text-ink">{sub}</p>}
    </div>
  );
}
