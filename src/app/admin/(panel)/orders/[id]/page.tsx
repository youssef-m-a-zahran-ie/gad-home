import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { isUuid, one, query } from "@/lib/db";
import { dateTime, egp, num, waLink } from "@/lib/format";
import type { OrderItemRow, OrderRow } from "@/lib/types";
import { Card, StatusBadge } from "@/components/admin/ui";
import { ProductImage } from "@/store/components/product-image";
import { CustomerForm, NoteForm, PaidToggle, PrintButton, StatusControl } from "./controls";

export const metadata: Metadata = { title: "تفاصيل الطلب" };

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  await requireAdmin();
  if (!isUuid(id)) notFound();
  const order = await one<OrderRow>("select * from orders where id = $1::uuid", [id]);
  if (!order) notFound();
  const items = await query<OrderItemRow>("select * from order_items where order_id = $1::uuid order by id", [id]);
  const o = { ...order, order_items: items };
  const prior = (await one<{ n: number }>("select count(*)::int as n from orders where phone = $1 and id <> $2::uuid", [o.phone, o.id]))?.n ?? 0;
  const wa = waLink(o.phone, `أهلاً ${o.customer_name}، معاك GAD Home بخصوص طلبك رقم ${o.number} بإجمالي ${o.total} جنيه.`);
  const profit = o.order_items.every((i) => i.cost != null)
    ? o.order_items.reduce((s, i) => s + (Number(i.price) - Number(i.cost)) * i.qty, 0)
    : null;

  return (
    <div className="grid gap-5">
      <div className="no-print">
        <Link href="/admin/orders" className="text-[17px] font-bold text-blue hover:underline">
          → كل الطلبات
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[30px]">طلب #{o.number}</h1>
          <StatusBadge status={o.status} />
        </div>
        <PrintButton />
      </div>
      <p className="-mt-3 text-[17px] text-muted">{dateTime(o.created_at)}{o.utm_source ? ` • جاي من: ${o.utm_source}` : ""}</p>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="grid gap-5">
          <Card>
            <h2 className="mb-3 text-[22px]">المنتجات</h2>
            <ul className="grid gap-3">
              {o.order_items.map((it) => (
                <li key={it.id} className="flex items-center gap-3">
                  <ProductImage path={it.image_path} alt="" className="size-16 shrink-0 rounded-lg border border-line p-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-bold">{it.name}</p>
                    <p className="text-[16px] text-muted">{num(it.qty)} × {egp(it.price)}</p>
                  </div>
                  <span className="text-[19px] font-extrabold">{egp(it.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-1 border-t border-line pt-3 text-[18px]">
              <div className="flex justify-between"><span>المنتجات</span><span>{egp(o.subtotal)}</span></div>
              <div className="flex justify-between"><span>الشحن ({o.governorate})</span><span>{egp(o.shipping)}</span></div>
              <div className="flex justify-between text-[22px] font-extrabold text-navy"><span>الإجمالي</span><span>{egp(o.total)}</span></div>
              {profit !== null && <div className="no-print flex justify-between text-[16px] text-muted"><span>المكسب (من غير الشحن)</span><span>{egp(profit)}</span></div>}
            </div>
          </Card>

          <Card className="no-print">
            <h2 className="mb-3 text-[22px]">حالة الطلب</h2>
            <StatusControl id={o.id} status={o.status} />
          </Card>

          <Card className="no-print">
            <h2 className="mb-3 text-[22px]">ملاحظاتك</h2>
            <NoteForm id={o.id} note={o.admin_note} />
          </Card>
        </div>

        <div className="grid gap-5">
          <Card>
            <h2 className="mb-3 text-[22px]">العميل</h2>
            <div className="grid gap-2 text-[18px]">
              <p className="text-[20px] font-bold">{o.customer_name}</p>
              <p dir="ltr" className="text-end font-bold">{o.phone}{o.phone2 ? ` / ${o.phone2}` : ""}</p>
              {prior > 0 && <p className="text-[16px] text-ok">عميل قديم: عمل {prior} طلب قبل كده</p>}
              <div className="no-print grid grid-cols-2 gap-2 pt-1">
                <a href={`tel:${o.phone}`} className="btn btn-outline btn-sm">اتصال</a>
                {wa && <a href={wa} target="_blank" rel="noopener" className="btn btn-whatsapp btn-sm">واتساب</a>}
              </div>
              <div className="mt-2 rounded-xl bg-soft p-3">
                <p className="font-bold">{o.governorate} - {o.city}</p>
                <p>{o.address}</p>
              </div>
              {o.notes && <p className="rounded-xl bg-warn-bg p-3 text-warn"><b>ملاحظة العميل:</b> {o.notes}</p>}
              <div className="no-print"><CustomerForm o={o} /></div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-[22px]">الدفع</h2>
            <p className="mb-3 text-[18px] font-bold">{o.payment_method === "cod" ? "كاش عند الاستلام" : "إنستاباي / محفظة"}</p>
            <div className="no-print"><PaidToggle id={o.id} paid={o.paid} /></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
