import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { query } from "@/lib/db";
import { dateTime, egp } from "@/lib/format";
import type { OrderRow, OrderStatus } from "@/lib/types";
import { Empty, PageHead, STATUS, StatusBadge } from "@/components/admin/ui";

export const metadata: Metadata = { title: "الطلبات" };

const TABS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "new", label: "جديد" },
  { key: "confirmed", label: STATUS.confirmed.label },
  { key: "shipped", label: STATUS.shipped.label },
  { key: "delivered", label: STATUS.delivered.label },
  { key: "cancelled", label: STATUS.cancelled.label },
];

const PER_PAGE = 50;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (typeof sp.status === "string" ? sp.status : "all") as OrderStatus | "all";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: string[] = [];
  const args: unknown[] = [];
  const arg = (v: unknown) => `$${args.push(v)}`;
  if (status !== "all") where.push(`o.status = ${arg(status)}::order_status`);
  if (q) {
    const digits = q.replace(/[^0-9]/g, "");
    const clean = q.replace(/[%_\\]/g, " ");
    where.push(
      /^\d{1,7}$/.test(q)
        ? `o.number = ${arg(Number(q))}`
        : digits.length >= 6
          ? `o.phone ilike ${arg(`%${digits}%`)}`
          : `o.customer_name ilike ${arg(`%${clean}%`)}`,
    );
  }
  const w = where.length ? `where ${where.join(" and ")}` : "";
  type OrderListRow = Pick<OrderRow, "id" | "number" | "status" | "customer_name" | "phone" | "governorate" | "city" | "total" | "payment_method" | "paid" | "created_at"> & { qty: number };
  const orders = await query<OrderListRow>(
    `select o.id, o.number, o.status, o.customer_name, o.phone, o.governorate, o.city, o.total, o.payment_method, o.paid, o.created_at,
       coalesce((select sum(i.qty) from order_items i where i.order_id = o.id), 0)::int as qty
     from orders o ${w} order by o.created_at desc limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    args,
  );
  const [{ n: count }] = await query<{ n: number }>(`select count(*)::int as n from orders o ${w}`, args);
  const pages = Math.ceil((count ?? 0) / PER_PAGE);
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <PageHead title="الطلبات" sub={`${count ?? 0} طلب`} />
      <form className="mb-4 flex max-w-xl gap-2" action="/admin/orders">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} className="input" placeholder="ابحث برقم الطلب أو الموبايل أو الاسم" />
        <button className="btn btn-navy shrink-0">بحث</button>
      </form>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/orders${t.key === "all" ? (q ? `?q=${encodeURIComponent(q)}` : "") : `?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}`}
            className={`inline-flex min-h-[46px] shrink-0 items-center rounded-xl border-2 px-4 text-[17px] font-bold ${
              status === t.key ? "border-navy bg-navy text-white" : "border-line bg-white text-navy"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <Empty text={q ? "مفيش طلبات بالبحث ده." : "مفيش طلبات هنا لسه."} />
      ) : (
        <ul className="grid gap-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="card grid gap-2 p-4 hover:border-blue sm:grid-cols-[110px_1fr_auto] sm:items-center sm:gap-4">
                <div className="flex items-center gap-2 sm:grid sm:gap-1">
                  <span className="text-[22px] font-extrabold text-navy">#{o.number}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="min-w-0">
                  <p className="text-[19px] font-bold">
                    {o.customer_name} <span className="font-normal text-muted" dir="ltr">{o.phone}</span>
                  </p>
                  <p className="text-[16px] text-muted">
                    {o.governorate}، {o.city} • {o.qty} قطعة • {dateTime(o.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:grid sm:justify-items-end sm:gap-1">
                  <span className="text-[21px] font-extrabold">{egp(o.total)}</span>
                  <span className={`badge ${o.payment_method === "instapay" ? (o.paid ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn") : "bg-sky text-navy"}`}>
                    {o.payment_method === "cod" ? "كاش" : o.paid ? "إنستاباي - مدفوع" : "إنستاباي - مستني التحويل"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {page > 1 && <Link className="btn btn-outline btn-sm" href={`/admin/orders${qs({ page: page - 1 })}`}>الأحدث</Link>}
          <span className="text-[17px] text-muted">صفحة {page} من {pages}</span>
          {page < pages && <Link className="btn btn-outline btn-sm" href={`/admin/orders${qs({ page: page + 1 })}`}>الأقدم</Link>}
        </div>
      )}
    </>
  );
}
