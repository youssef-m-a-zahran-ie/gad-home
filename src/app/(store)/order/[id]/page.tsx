import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { egp, num, waLink } from "@/lib/format";
import { getReceipt, getSettings } from "@/store/data";
import { CheckIcon, WhatsAppIcon } from "@/store/components/icons";
import { ProductImage } from "@/store/components/product-image";

export const metadata: Metadata = { title: "تم استلام طلبك", robots: { index: false } };

export default async function OrderPage({ params }: PageProps<"/order/[id]">) {
  const { id } = await params;
  const [r, s] = await Promise.all([getReceipt(id), getSettings()]);
  if (!r) notFound();
  const payNumber = s.instapay || s.wallet;
  const wa = waLink(
    s.whatsapp,
    r.payment === "instapay"
      ? `السلام عليكم، ده إيصال تحويل طلب رقم ${r.number} بمبلغ ${r.total} جنيه`
      : `السلام عليكم، بخصوص طلب رقم ${r.number}`,
  );

  return (
    <div className="container-page grid max-w-3xl gap-6 py-8">
      <div className="grid justify-items-center gap-3 rounded-3xl bg-ok-bg px-5 py-8 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-ok text-white">
          <CheckIcon size={44} strokeWidth={3} />
        </span>
        <h1 className="text-[28px] text-ok sm:text-[34px]">تم استلام طلبك، شكراً يا {r.name.split(" ")[0]}!</h1>
        <p className="text-[20px]">
          رقم الطلب: <b className="text-[26px] text-navy">{r.number}</b>
        </p>
        <p className="max-w-lg text-[18px] text-muted">هنكلمك على رقم <span dir="ltr">{r.phone}</span> قريب عشان نأكد الطلب ومعاد التوصيل.</p>
      </div>

      {r.payment === "instapay" && payNumber && (
        <div className="card grid gap-3 border-2 border-blue p-5">
          <h2 className="text-[24px]">خطوة أخيرة: التحويل</h2>
          <p className="text-[19px]">
            حوّل <b className="text-navy">{egp(r.total)}</b> على إنستاباي أو المحفظة على الرقم:
          </p>
          <p className="rounded-xl bg-sky py-3 text-center text-[28px] font-extrabold tracking-wider text-navy" dir="ltr">
            {payNumber}
          </p>
          <p className="text-[18px] text-muted">وبعدها ابعتلنا صورة التحويل على واتساب ومعاها رقم الطلب.</p>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="btn btn-whatsapp w-full">
              <WhatsAppIcon size={26} /> ابعت صورة التحويل واتساب
            </a>
          )}
        </div>
      )}

      <div className="card grid gap-4 p-5">
        <h2 className="text-[24px]">تفاصيل الطلب</h2>
        <ul className="grid gap-3">
          {r.items.map((it, i) => (
            <li key={i} className="flex items-center gap-3">
              <ProductImage path={it.image} alt="" className="size-16 shrink-0 rounded-lg border border-line p-0.5" />
              <span className="min-w-0 flex-1 text-[18px]">
                {it.name} <b className="text-navy">× {num(it.qty)}</b>
              </span>
              <span className="font-bold">{egp(it.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 border-t border-line pt-3 text-[19px]">
          <div className="flex justify-between"><span>المنتجات</span><span>{egp(r.subtotal)}</span></div>
          <div className="flex justify-between"><span>الشحن</span><span>{Number(r.shipping) === 0 ? "مجاني" : egp(r.shipping)}</span></div>
          <div className="flex justify-between text-[23px] font-extrabold text-navy"><span>الإجمالي</span><span>{egp(r.total)}</span></div>
          <div className="flex justify-between text-[18px] text-muted"><span>طريقة الدفع</span><span>{r.payment === "cod" ? "كاش عند الاستلام" : "إنستاباي / محفظة"}</span></div>
        </div>
        <div className="rounded-xl bg-soft p-3 text-[18px]">
          <b>التوصيل إلى:</b> {r.governorate}، {r.city}، {r.address}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/" className="btn btn-primary">كمّل تسوق</Link>
        {wa && r.payment === "cod" && (
          <a href={wa} target="_blank" rel="noopener" className="btn btn-whatsapp">
            <WhatsAppIcon size={24} /> عندك سؤال؟ واتساب
          </a>
        )}
      </div>
    </div>
  );
}
