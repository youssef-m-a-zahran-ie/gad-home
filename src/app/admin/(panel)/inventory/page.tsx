import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { query } from "@/lib/db";
import { egp, num } from "@/lib/format";
import { Empty, PageHead } from "@/components/admin/ui";
import { InventoryRow } from "./row";

export const metadata: Metadata = { title: "المخزون" };

const TABS = [
  { key: "all", label: "الكل" },
  { key: "low", label: "قرب يخلص" },
  { key: "out", label: "خلص" },
];

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = typeof sp.f === "string" ? sp.f : "all";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const all = await query<{
    id: string; name: string; stock: number; low_stock_at: number; is_active: boolean; cost: number | null; price: number; image: string | null;
  }>(
    `select p.id, p.name, p.stock, p.low_stock_at, p.is_active, p.cost, p.price,
       (select i.path from product_images i where i.product_id = p.id order by i.sort limit 1) as image
     from products p ${q ? "where p.name ilike $1" : ""} order by p.stock asc, p.name limit 1000`,
    q ? [`%${q.replace(/[%_\\]/g, " ")}%`] : [],
  );
  const out = all.filter((p) => p.stock <= 0);
  const low = all.filter((p) => p.stock > 0 && p.stock <= p.low_stock_at);
  const rows = tab === "out" ? out : tab === "low" ? low : all;
  const pieces = all.reduce((s, p) => s + Math.max(0, p.stock), 0);
  const value = all.reduce((s, p) => s + Math.max(0, p.stock) * Number(p.cost ?? 0), 0);

  return (
    <>
      <PageHead title="المخزون" sub="«وصل بضاعة» بيزوّد على الموجود، و«تعديل العدد» لما تجرد وتكتب العدد الحقيقي." />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="إجمالي القطع" value={num(pieces)} />
        <Stat label="قرب يخلص" value={num(low.length)} tone="warn" />
        <Stat label="خلص" value={num(out.length)} tone="sale" />
        <Stat label="قيمة المخزون (بسعر الشراء)" value={value ? egp(value) : "—"} />
      </div>
      <form className="mb-3 flex max-w-xl gap-2" action="/admin/inventory">
        {tab !== "all" && <input type="hidden" name="f" value={tab} />}
        <input name="q" defaultValue={q} className="input" placeholder="ابحث باسم المنتج" />
        <button className="btn btn-navy shrink-0">بحث</button>
      </form>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/inventory${t.key === "all" ? "" : `?f=${t.key}`}`}
            className={`inline-flex min-h-[46px] items-center rounded-xl border-2 px-4 text-[17px] font-bold ${tab === t.key ? "border-navy bg-navy text-white" : "border-line bg-white text-navy"}`}
          >
            {t.label} ({t.key === "out" ? out.length : t.key === "low" ? low.length : all.length})
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty text={tab === "all" ? "لسه مفيش منتجات." : "مفيش منتجات هنا. كله تمام 👌"} />
      ) : (
        <ul className="grid gap-3">
          {rows.map((p) => (
            <InventoryRow
              key={p.id}
              p={{
                id: p.id,
                name: p.name,
                stock: p.stock,
                low: p.low_stock_at,
                active: p.is_active,
                image: p.image,
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "sale" }) {
  return (
    <div className="card p-4">
      <p className="text-[15px] font-bold text-muted">{label}</p>
      <p className={`text-[24px] font-extrabold ${tone === "warn" ? "text-warn" : tone === "sale" ? "text-sale" : "text-navy"}`}>{value}</p>
    </div>
  );
}
