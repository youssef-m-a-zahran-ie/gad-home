import type { Metadata } from "next";
import { getSettings } from "@/store/data";
import { CartView } from "@/store/components/cart-view";
import { Breadcrumbs } from "@/store/components/section";

export const metadata: Metadata = { title: "سلة المشتريات", robots: { index: false } };

export default async function CartPage() {
  const s = await getSettings();
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: "السلة" }]} />
      <div className="container-page grid gap-5 py-5">
        <h1 className="text-[28px] sm:text-[34px]">سلة المشتريات</h1>
        <CartView freeOver={s.free_shipping_over == null ? null : Number(s.free_shipping_over)} minOrder={Number(s.min_order)} />
      </div>
    </>
  );
}
