"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, Field, Notice, SubmitButton, Toggle } from "@/components/admin/form-bits";
import { ImagePicker } from "@/components/admin/image-picker";
import type { ActionState } from "@/lib/admin/state";
import { mediaUrl } from "@/lib/media";
import type { BannerRow, SettingsRow } from "@/lib/types";
import { addAdmin, addBanner, changePassword, deleteBanner, removeAdmin, saveSettings, updateBanner } from "./actions";

export function SettingsForm({ s }: { s: SettingsRow }) {
  const t = (k: keyof SettingsRow) => (s[k] == null ? "" : String(s[k]));
  return (
    <ActionForm action={saveSettings} className="grid gap-5">
      {(st) => (
        <>
          <section className="card grid gap-4 p-4 sm:p-5">
            <h2 className="text-[22px]">بيانات المتجر</h2>
            <Field label="اسم المتجر" htmlFor="store_name" error={st?.errors?.store_name}>
              <input id="store_name" name="store_name" className="input" defaultValue={t("store_name")} />
            </Field>
            <Field label="اللوجو (اختياري)" hint="لو مفيش لوجو بيظهر الاسم مكتوب">
              <ImagePicker name="logo" initial={s.logo_path ? [s.logo_path] : []} folder="brand" max={1} />
            </Field>
            <Field label="جملة تحت الاسم" htmlFor="tagline">
              <input id="tagline" name="tagline" className="input" defaultValue={t("tagline")} />
            </Field>
            <Field label="الشريط اللي فوق الموقع" htmlFor="announcement" hint="مثلاً: خصومات لحد ٤٠٪ • الدفع عند الاستلام. سيبه فاضي لو مش عايزه">
              <input id="announcement" name="announcement" className="input" defaultValue={t("announcement")} />
            </Field>
            <Field label="العنوان (يظهر تحت في الموقع)" htmlFor="address">
              <input id="address" name="address" className="input" defaultValue={t("address")} />
            </Field>
          </section>

          <section className="card grid gap-4 p-4 sm:p-5">
            <h2 className="text-[22px]">التواصل والدفع</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="رقم التليفون" htmlFor="phone"><input id="phone" name="phone" className="input" dir="ltr" defaultValue={t("phone")} /></Field>
              <Field label="رقم الواتساب" htmlFor="whatsapp"><input id="whatsapp" name="whatsapp" className="input" dir="ltr" defaultValue={t("whatsapp")} /></Field>
              <Field label="رقم/اسم إنستاباي" htmlFor="instapay" hint="سيبه فاضي هو والمحفظة لو مش عايز الدفع ده"><input id="instapay" name="instapay" className="input" dir="ltr" defaultValue={t("instapay")} /></Field>
              <Field label="رقم المحفظة (فودافون كاش…)" htmlFor="wallet"><input id="wallet" name="wallet" className="input" dir="ltr" defaultValue={t("wallet")} /></Field>
              <Field label="لينك فيسبوك" htmlFor="facebook"><input id="facebook" name="facebook" className="input" dir="ltr" defaultValue={t("facebook")} /></Field>
              <Field label="لينك إنستجرام" htmlFor="instagram"><input id="instagram" name="instagram" className="input" dir="ltr" defaultValue={t("instagram")} /></Field>
              <Field label="لينك تيك توك" htmlFor="tiktok"><input id="tiktok" name="tiktok" className="input" dir="ltr" defaultValue={t("tiktok")} /></Field>
            </div>
          </section>

          <section className="card grid gap-4 p-4 sm:p-5">
            <h2 className="text-[22px]">الشحن والطلبات</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="شحن مجاني للطلبات من (جنيه)" htmlFor="free" hint="سيبه فاضي لو مفيش شحن مجاني" error={st?.errors?.free_shipping_over}>
                <input id="free" name="free_shipping_over" className="input" inputMode="decimal" dir="ltr" defaultValue={t("free_shipping_over")} />
              </Field>
              <Field label="أقل قيمة للطلب (جنيه)" htmlFor="min" hint="٠ يعني مفيش حد أدنى" error={st?.errors?.min_order}>
                <input id="min" name="min_order" className="input" inputMode="decimal" dir="ltr" defaultValue={t("min_order")} />
              </Field>
              <Field label="مدة التوصيل" htmlFor="days"><input id="days" name="delivery_days" className="input" defaultValue={t("delivery_days")} placeholder="من ٢ إلى ٥ أيام عمل" /></Field>
              <Field label="أيام الاستبدال والاسترجاع" htmlFor="ret"><input id="ret" name="return_days" className="input" inputMode="numeric" dir="ltr" defaultValue={t("return_days")} /></Field>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-4 border-t border-line bg-white/95 px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            <SubmitButton className="btn btn-primary min-w-48">احفظ الإعدادات</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function Banners({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  return (
    <section className="card grid gap-4 p-4 sm:p-5">
      <h2 className="text-[22px]">البانرات (الصور الكبيرة في أول الصفحة الرئيسية)</h2>
      <p className="text-[16px] text-muted">أحسن مقاس للكمبيوتر ١٩٢٠×٧٠٠، وللموبايل صورة طولية ١٠٨٠×١٠٨٠. لو مفيش بانرات بيظهر مربع أزرق باسم المتجر.</p>
      {banners.length > 0 && (
        <ul className="grid gap-3">
          {banners.map((b) => (
            <BannerItem key={b.id} b={b} onChange={() => router.refresh()} />
          ))}
        </ul>
      )}
      <details className="rounded-xl border-2 border-dashed border-line p-3">
        <summary className="cursor-pointer text-[18px] font-bold text-blue">+ أضف بانر</summary>
        <ActionForm action={addBanner} className="mt-4 grid gap-4" resetOnSuccess onSuccess={() => router.refresh()}>
          {(s) => (
            <>
              <Field label="صورة الكمبيوتر"><ImagePicker key={`d${s?.at ?? 0}`} name="image" initial={[]} folder="banners" max={1} /></Field>
              <Field label="صورة الموبايل (اختياري)"><ImagePicker key={`m${s?.at ?? 0}`} name="mobile_image" initial={[]} folder="banners" max={1} /></Field>
              <Field label="يفتح على (اختياري)" htmlFor="b-link" hint="مثلاً /offers أو /category/trays">
                <input id="b-link" name="link" className="input" dir="ltr" placeholder="/offers" />
              </Field>
              <Field label="وصف قصير للصورة (اختياري)" htmlFor="b-title"><input id="b-title" name="title" className="input" /></Field>
              <input type="hidden" name="sort" value={banners.length} />
              <SubmitButton className="btn btn-primary w-fit">أضف البانر</SubmitButton>
            </>
          )}
        </ActionForm>
      </details>
    </section>
  );
}

function BannerItem({ b, onChange }: { b: BannerRow; onChange: () => void }) {
  const [state, setState] = useState<ActionState>(null);
  return (
    <li className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[220px_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(b.image_path)!} alt="" className="w-full rounded-lg border border-line" />
      <ActionForm action={updateBanner.bind(null, b.id)} className="grid gap-2" onSuccess={onChange}>
        <input name="link" defaultValue={b.link ?? ""} className="input" dir="ltr" placeholder="يفتح على (اختياري)" aria-label="يفتح على" />
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[16px]" htmlFor={`s-${b.id}`}>الترتيب</label>
          <input id={`s-${b.id}`} name="sort" defaultValue={b.sort} className="input w-20" dir="ltr" />
        </div>
        <Toggle name="is_active" label="ظاهر" defaultChecked={b.is_active} />
        <div className="flex flex-wrap gap-2">
          <SubmitButton className="btn btn-outline btn-sm">احفظ</SubmitButton>
          <button type="button" className="btn btn-danger btn-sm" onClick={async () => { setState(await deleteBanner(b.id)); onChange(); }}>
            امسح
          </button>
        </div>
        <Notice state={state} />
      </ActionForm>
    </li>
  );
}

export function Admins({ emails, me }: { emails: string[]; me: string }) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>(null);
  return (
    <section className="card grid gap-4 p-4 sm:p-5">
      <h2 className="text-[22px]">مين يقدر يدخل لوحة التحكم</h2>
      <ul className="grid gap-2">
        {emails.map((e) => (
          <li key={e} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-soft px-3 py-2">
            <span dir="ltr" className="text-[17px] font-bold">{e}{e === me ? " (إنت)" : ""}</span>
            {e !== me && (
              <button type="button" className="text-[16px] font-bold text-sale hover:underline" onClick={async () => { setState(await removeAdmin(e)); router.refresh(); }}>
                شيل
              </button>
            )}
          </li>
        ))}
      </ul>
      <Notice state={state} />
      <ActionForm action={addAdmin} className="grid gap-3 sm:max-w-md" resetOnSuccess onSuccess={() => router.refresh()}>
        {(s) => (
          <>
            <Field label="ضيف إيميل أدمن جديد" htmlFor="new-admin" error={s?.errors?.email}>
              <input id="new-admin" name="email" type="email" className="input" dir="ltr" autoComplete="off" />
            </Field>
            <Field label="باسورد مؤقت ليه" htmlFor="new-admin-pass" hint="٨ حروف أو أرقام على الأقل. هو يغيره بعد ما يدخل." error={s?.errors?.password}>
              <input id="new-admin-pass" name="password" type="text" className="input" dir="ltr" autoComplete="off" />
            </Field>
            <SubmitButton className="btn btn-navy w-fit">ضيف</SubmitButton>
            <Notice state={s} />
          </>
        )}
      </ActionForm>
    </section>
  );
}

export function PasswordForm() {
  return (
    <section className="card grid gap-4 p-4 sm:p-5">
      <h2 className="text-[22px]">غيّر الباسورد</h2>
      <ActionForm action={changePassword} className="grid gap-3 sm:max-w-md" resetOnSuccess>
        {(s) => (
          <>
            <Field label="الباسورد الجديد" htmlFor="np" error={s?.errors?.password}>
              <input id="np" name="password" type="password" className="input" dir="ltr" autoComplete="new-password" />
            </Field>
            <Field label="اكتبه تاني" htmlFor="nc" error={s?.errors?.confirm}>
              <input id="nc" name="confirm" type="password" className="input" dir="ltr" autoComplete="new-password" />
            </Field>
            <SubmitButton className="btn btn-outline w-fit">غيّر الباسورد</SubmitButton>
          </>
        )}
      </ActionForm>
    </section>
  );
}
