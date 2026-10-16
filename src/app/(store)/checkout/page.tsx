import type { Metadata } from "next";
import { getGovernorates, getSettings } from "@/store/data";
import { CheckoutForm } from "@/store/components/checkout-form";
import { Breadcrumbs } from "@/store/components/section";

export const metadata: Metadata = { title: "إتمام الطلب", robots: { index: false } };

export default async function CheckoutPage() {
  const [s, govs] = await Promise.all([getSettings(), getGovernorates()]);
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { href: "/cart", label: "السلة" }, { label: "إتمام الطلب" }]} />
      <div className="container-page grid gap-5 py-5">
        <h1 className="text-[28px] sm:text-[34px]">إتمام الطلب</h1>
        <CheckoutForm
          governorates={govs}
          freeOver={s.free_shipping_over == null ? null : Number(s.free_shipping_over)}
          minOrder={Number(s.min_order)}
          instapay={s.instapay || s.wallet || null}
        />
      </div>
    </>
  );
}
