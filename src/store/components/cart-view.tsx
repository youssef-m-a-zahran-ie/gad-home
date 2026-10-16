"use client";

import Link from "next/link";
import { egp, num } from "@/lib/format";
import { useCart } from "../cart";
import { useCartSync } from "../use-cart-sync";
import { TrashIcon } from "./icons";
import { ProductImage } from "./product-image";
import { QtyStepper } from "./qty-stepper";
import { EmptyState } from "./section";

export function CartView({ freeOver, minOrder }: { freeOver: number | null; minOrder: number }) {
  const { items, ready, subtotal, count, setQty, remove } = useCart();
  const { notes } = useCartSync();

  if (!ready) return <div className="h-64" aria-busy="true" />;
  if (!items.length) {
    return (
      <EmptyState
        title="السلة فاضية"
        text="لسه ما اخترتش أي منتج. اتفرج على الأقسام والعروض."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/offers" className="btn btn-primary">شوف العروض</Link>
            <Link href="/categories" className="btn btn-outline">كل الأقسام</Link>
          </div>
        }
      />
    );
  }

  const left = freeOver ? freeOver - subtotal : null;
  const belowMin = minOrder > 0 && subtotal < minOrder;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="grid gap-3">
        {notes.length > 0 && (
          <ul className="grid gap-1 rounded-2xl bg-warn-bg p-4 text-[17px] font-bold text-warn" role="status">
            {notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        )}
        <ul className="grid gap-3">
          {items.map((it) => (
            <li key={it.id} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link href={`/product/${encodeURIComponent(it.slug)}`} className="shrink-0">
                <ProductImage path={it.image} alt={it.name} className="size-24 rounded-xl border border-line p-1 sm:size-28" />
              </Link>
              <div className="grid min-w-0 flex-1 gap-2">
                <Link href={`/product/${encodeURIComponent(it.slug)}`} className="text-[18px] leading-snug font-bold hover:text-blue">
                  {it.name}
                </Link>
                <p className="text-[17px] text-muted">سعر القطعة: {egp(it.price)}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <QtyStepper value={it.qty} max={Math.max(1, it.stock)} onChange={(n) => n >= 1 && setQty(it.id, n)} size="md" />
                  <p className="text-[20px] font-extrabold text-navy">{egp(it.price * it.qty)}</p>
                </div>
                <button type="button" onClick={() => remove(it.id)} className="inline-flex w-fit items-center gap-1 rounded-lg py-1 text-[17px] font-bold text-sale hover:underline">
                  <TrashIcon size={20} /> شيل من السلة
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="card grid gap-4 p-5 lg:sticky lg:top-40">
        <h2 className="text-[24px]">ملخص الطلب</h2>
        <div className="flex justify-between text-[19px]">
          <span>المنتجات ({num(count)})</span>
          <span className="font-bold">{egp(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[18px] text-muted">
          <span>الشحن</span>
          <span>{left !== null && left <= 0 ? <b className="text-ok">مجاني</b> : "بيتحسب حسب المحافظة"}</span>
        </div>
        {left !== null && left > 0 && (
          <p className="rounded-xl bg-sky px-3 py-2 text-[17px] font-bold text-navy">
            فاضلك {egp(left)} وتاخد الشحن مجاني
          </p>
        )}
        {belowMin && <p className="rounded-xl bg-warn-bg px-3 py-2 text-[17px] font-bold text-warn">أقل قيمة للطلب {egp(minOrder)}</p>}
        <Link href="/checkout" aria-disabled={belowMin} className={`btn btn-primary w-full text-[21px] ${belowMin ? "pointer-events-none opacity-50" : ""}`}>
          كمّل الطلب
        </Link>
        <Link href="/" className="btn btn-outline w-full">
          كمّل تسوق
        </Link>
        <p className="text-center text-[16px] text-muted">الدفع كاش عند الاستلام أو إنستاباي</p>
      </aside>
    </div>
  );
}
