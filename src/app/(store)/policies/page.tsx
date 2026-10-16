import type { Metadata } from "next";
import { getSettings } from "@/store/data";
import { Breadcrumbs } from "@/store/components/section";

export const metadata: Metadata = { title: "الشحن والاستبدال والاسترجاع" };

export default async function PoliciesPage() {
  const s = await getSettings();
  const blocks = [
    {
      t: "الشحن والتوصيل",
      p: [
        "بنوصّل لكل محافظات مصر، وسعر الشحن بيظهر حسب المحافظة في صفحة إتمام الطلب.",
        s.delivery_days ? `مدة التوصيل عادةً ${s.delivery_days}.` : "",
        s.free_shipping_over ? `الشحن مجاني للطلبات من ${Number(s.free_shipping_over)} جنيه وأكتر.` : "",
        "بنكلمك نأكد الطلب قبل ما نشحنه.",
      ],
    },
    {
      t: "الدفع",
      p: ["الدفع كاش للمندوب عند الاستلام.", s.instapay || s.wallet ? "أو تحويل على إنستاباي / محفظة إلكترونية وتبعتلنا صورة التحويل واتساب." : ""],
    },
    {
      t: "الاستبدال والاسترجاع",
      p: [
        "تقدر تعاين الطلب قبل ما تستلمه.",
        `الاستبدال أو الاسترجاع خلال ${s.return_days} يوم من الاستلام، بشرط إن المنتج يكون بحالته وبالكرتونة بتاعته.`,
        "لو المنتج وصل مكسور أو فيه عيب، بنبدله على حسابنا. كلمنا واتساب وابعت صورة.",
      ],
    },
  ];
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: "الشحن والاستبدال" }]} />
      <div className="container-page grid max-w-3xl gap-5 py-6">
        <h1 className="text-[28px] sm:text-[34px]">الشحن والاستبدال والاسترجاع</h1>
        {blocks.map((b) => (
          <section key={b.t} className="card grid gap-2 p-5">
            <h2 className="text-[24px]">{b.t}</h2>
            <ul className="grid list-disc gap-1 ps-6 text-[19px]">
              {b.p.filter(Boolean).map((x) => <li key={x}>{x}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
