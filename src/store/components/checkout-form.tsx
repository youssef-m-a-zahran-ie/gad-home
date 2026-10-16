"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { egp, num } from "@/lib/format";
import type { GovernorateRow } from "@/lib/supabase/database.types";
import { placeOrder } from "../actions";
import { useCart } from "../cart";
import { useCartSync } from "../use-cart-sync";
import { CashIcon, CheckIcon } from "./icons";
import { ProductImage } from "./product-image";
import { EmptyState } from "./section";
import { readUtm } from "./utm-capture";

type Form = {
  name: string;
  phone: string;
  phone2: string;
  governorate_id: string;
  city: string;
  address: string;
  notes: string;
  payment: "cod" | "instapay";
};

const SAVED = "gad-customer-v1";
const EMPTY: Form = { name: "", phone: "", phone2: "", governorate_id: "", city: "", address: "", notes: "", payment: "cod" };

function digits(s: string) {
  return s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^0-9]/g, "");
}

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 2) e.name = "اكتب اسمك";
  let p = digits(f.phone);
  if (p.startsWith("20") && p.length === 12) p = "0" + p.slice(2);
  if (!/^01[0125]\d{8}$/.test(p)) e.phone = "رقم الموبايل لازم يكون ١١ رقم ويبدأ بـ 01";
  if (f.phone2 && !/^01[0125]\d{8}$/.test(digits(f.phone2))) e.phone2 = "الرقم ده مش مظبوط (أو سيبه فاضي)";
  if (!f.governorate_id) e.governorate_id = "اختار المحافظة";
  if (f.city.trim().length < 2) e.city = "اكتب المدينة أو المنطقة";
  if (f.address.trim().length < 5) e.address = "اكتب العنوان بالتفصيل (الشارع، رقم العمارة، الدور)";
  return e;
}

export function CheckoutForm({
  governorates,
  freeOver,
  minOrder,
  instapay,
}: {
  governorates: GovernorateRow[];
  freeOver: number | null;
  minOrder: number;
  instapay: string | null;
}) {
  const router = useRouter();
  const { items, ready, subtotal, count, clear } = useCart();
  const { notes, synced } = useCartSync();
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  // Fill in last time's details, so a returning customer just checks and confirms.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved details once
      if (raw) setF({ ...EMPTY, ...JSON.parse(raw), notes: "", payment: "cod" });
    } catch {
      // ignore
    }
  }, []);

  const gov = governorates.find((g) => String(g.id) === f.governorate_id);
  const free = freeOver != null && subtotal >= freeOver;
  const shipping = gov ? (free ? 0 : Number(gov.fee)) : null;
  const total = subtotal + (shipping ?? 0);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setF((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errs = validate(f);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setBusy(true);
    const utm = readUtm();
    const res = await placeOrder({
      items: items.map((i) => ({ id: i.id, qty: i.qty })),
      ...f,
      utm_source: utm?.source,
      utm_campaign: utm?.campaign,
    }).catch(() => ({ ok: false as const, message: "النت فصل أو حصلت مشكلة. جرب تاني." }));
    if (res.ok) {
      try {
        const { name, phone, phone2, governorate_id, city, address } = f;
        localStorage.setItem(SAVED, JSON.stringify({ name, phone, phone2, governorate_id, city, address }));
      } catch {
        // ignore
      }
      setPlaced(true);
      clear();
      router.replace(`/order/${res.id}`);
      return;
    }
    setServerError(res.message);
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!ready || placed) return <div className="h-64" aria-busy="true" />;
  if (!items.length) {
    return (
      <EmptyState
        title="السلة فاضية"
        text="ضيف منتجات للسلة الأول."
        action={<Link href="/" className="btn btn-primary">ارجع للرئيسية</Link>}
      />
    );
  }

  const field = (k: keyof Form) => `input ${errors[k] ? "input-error" : ""}`;
  const belowMin = minOrder > 0 && subtotal < minOrder;

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
      <div className="grid gap-6">
        {serverError && (
          <p className="rounded-2xl border-2 border-sale bg-[#fdecec] p-4 text-[18px] font-bold text-sale" role="alert">
            {serverError}
          </p>
        )}
        {notes.length > 0 && (
          <ul className="grid gap-1 rounded-2xl bg-warn-bg p-4 text-[17px] font-bold text-warn" role="status">
            {notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        )}

        <fieldset className="card grid gap-5 p-5 sm:p-6">
          <legend className="float-right mb-1 w-full text-[24px] font-extrabold text-navy">1. بياناتك</legend>
          <div>
            <label htmlFor="f-name" className="field-label">الاسم</label>
            <input id="f-name" className={field("name")} value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="f-phone" className="field-label">رقم الموبايل</label>
            <input
              id="f-phone"
              className={field("phone")}
              value={f.phone}
              onChange={(e) => set("phone", e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="01xxxxxxxxx"
              dir="ltr"
              style={{ textAlign: "right" }}
            />
            {errors.phone ? <p className="field-error">{errors.phone}</p> : <p className="mt-1 text-[16px] text-muted">هنكلمك عليه نأكد الطلب</p>}
          </div>
          <div>
            <label htmlFor="f-phone2" className="field-label">
              رقم تاني <span className="font-normal text-muted">(لو حابب)</span>
            </label>
            <input
              id="f-phone2"
              className={field("phone2")}
              value={f.phone2}
              onChange={(e) => set("phone2", e.target.value)}
              inputMode="tel"
              dir="ltr"
              style={{ textAlign: "right" }}
            />
            {errors.phone2 && <p className="field-error">{errors.phone2}</p>}
          </div>
        </fieldset>

        <fieldset className="card grid gap-5 p-5 sm:p-6">
          <legend className="float-right mb-1 w-full text-[24px] font-extrabold text-navy">2. عنوان التوصيل</legend>
          <div>
            <label htmlFor="f-governorate_id" className="field-label">المحافظة</label>
            <select id="f-governorate_id" className={field("governorate_id")} value={f.governorate_id} onChange={(e) => set("governorate_id", e.target.value)}>
              <option value="">اختار المحافظة</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (شحن {free ? "مجاني" : egp(g.fee)})
                </option>
              ))}
            </select>
            {errors.governorate_id && <p className="field-error">{errors.governorate_id}</p>}
          </div>
          <div>
            <label htmlFor="f-city" className="field-label">المدينة / المنطقة</label>
            <input id="f-city" className={field("city")} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="مثلاً: مدينة نصر" />
            {errors.city && <p className="field-error">{errors.city}</p>}
          </div>
          <div>
            <label htmlFor="f-address" className="field-label">العنوان بالتفصيل</label>
            <textarea
              id="f-address"
              className={field("address")}
              value={f.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="اسم الشارع، رقم العمارة، الدور، علامة مميزة"
              autoComplete="street-address"
            />
            {errors.address && <p className="field-error">{errors.address}</p>}
          </div>
          <div>
            <label htmlFor="f-notes" className="field-label">
              ملاحظات <span className="font-normal text-muted">(لو حابب)</span>
            </label>
            <input id="f-notes" className="input" value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="مثلاً: اتصل قبل ما تيجي" />
          </div>
        </fieldset>

        <fieldset className="card grid gap-3 p-5 sm:p-6">
          <legend className="float-right mb-3 w-full text-[24px] font-extrabold text-navy">3. طريقة الدفع</legend>
          {[
            { v: "cod" as const, title: "كاش عند الاستلام", text: "ادفع للمندوب لما الطلب يوصلك" },
            ...(instapay
              ? [{ v: "instapay" as const, title: "إنستاباي أو محفظة إلكترونية", text: `حوّل على ${instapay} بعد ما تأكد الطلب، وابعتلنا صورة التحويل واتساب` }]
              : []),
          ].map((o) => (
            <label
              key={o.v}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-[3px] p-4 ${f.payment === o.v ? "border-blue bg-sky" : "border-line bg-white"}`}
            >
              <input type="radio" name="payment" value={o.v} checked={f.payment === o.v} onChange={() => set("payment", o.v)} className="mt-1.5 size-6 accent-[var(--blue)]" />
              <span>
                <span className="flex items-center gap-2 text-[20px] font-extrabold text-navy">
                  {o.v === "cod" && <CashIcon size={24} />} {o.title}
                </span>
                <span className="block text-[17px] text-muted">{o.text}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      <aside className="card grid gap-4 p-5 lg:sticky lg:top-40">
        <h2 className="text-[24px]">طلبك ({num(count)})</h2>
        <ul className="grid max-h-80 gap-3 overflow-y-auto">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3">
              <ProductImage path={it.image} alt="" className="size-16 shrink-0 rounded-lg border border-line p-0.5" />
              <span className="min-w-0 flex-1 text-[17px] leading-snug">
                {it.name} <b className="text-navy">× {num(it.qty)}</b>
              </span>
              <span className="shrink-0 text-[17px] font-bold">{egp(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 border-t border-line pt-3 text-[19px]">
          <div className="flex justify-between">
            <span>المنتجات</span>
            <span className="font-bold">{egp(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>الشحن</span>
            <span className="font-bold">
              {shipping === null ? <span className="text-[17px] font-normal text-muted">اختار المحافظة</span> : shipping === 0 ? <span className="text-ok">مجاني</span> : egp(shipping)}
            </span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-[23px] font-extrabold text-navy">
            <span>الإجمالي</span>
            <span>{egp(total)}</span>
          </div>
        </div>
        {belowMin && <p className="rounded-xl bg-warn-bg px-3 py-2 text-[17px] font-bold text-warn">أقل قيمة للطلب {egp(minOrder)}</p>}
        <button type="submit" disabled={busy || !synced || belowMin} className="btn btn-primary w-full text-[22px]">
          {busy ? "بنسجل طلبك…" : (
            <>
              <CheckIcon size={26} /> تأكيد الطلب
            </>
          )}
        </button>
        <p className="text-center text-[16px] text-muted">هنكلمك نأكد الطلب قبل الشحن</p>
      </aside>
    </form>
  );
}
