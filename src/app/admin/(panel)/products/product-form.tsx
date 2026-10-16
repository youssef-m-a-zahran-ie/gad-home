"use client";

import { useState } from "react";
import { ActionForm, Field, SubmitButton, Toggle } from "@/components/admin/form-bits";
import { ImagePicker } from "@/components/admin/image-picker";
import type { ProductRow } from "@/lib/supabase/database.types";
import { categoryOptions, type CatOption } from "./options";
import { deleteProduct, saveProduct } from "./actions";

export function ProductForm({ product, images, cats }: { product: ProductRow | null; images: string[]; cats: CatOption[] }) {
  const action = saveProduct.bind(null, product?.id ?? null);
  const p = product;
  return (
    <ActionForm action={action} className="grid gap-5">
      {(s) => (
        <>
          <section className="card grid gap-4 p-4 sm:p-5">
            <h2 className="text-[22px]">صور المنتج</h2>
            <ImagePicker name="images" initial={images} folder="products" />
          </section>

          <section className="card grid gap-4 p-4 sm:p-5">
            <h2 className="text-[22px]">البيانات الأساسية</h2>
            <Field label="اسم المنتج" htmlFor="name" error={s?.errors?.name}>
              <input id="name" name="name" className="input" defaultValue={p?.name ?? ""} placeholder="مثلاً: صينية فرن ستانلس ٤٠ سم" />
            </Field>
            <Field label="القسم" htmlFor="category_id">
              <select id="category_id" name="category_id" className="input" defaultValue={p?.category_id ?? ""}>
                <option value="">بدون قسم</option>
                {categoryOptions(cats).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الوصف" htmlFor="description" hint="اكتب المقاس، الخامة، الألوان، أي حاجة تفيد العميل.">
              <textarea id="description" name="description" className="input min-h-40" defaultValue={p?.description ?? ""} />
            </Field>
          </section>

          <section className="card grid gap-4 p-4 sm:p-5">
            <h2 className="text-[22px]">السعر والمخزون</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="السعر (جنيه)" htmlFor="price" error={s?.errors?.price}>
                <input id="price" name="price" className="input" inputMode="decimal" defaultValue={p?.price ?? ""} dir="ltr" />
              </Field>
              <Field label="السعر قبل الخصم (لو في عرض)" htmlFor="compare_at_price" hint="سيبه فاضي لو مفيش خصم" error={s?.errors?.compare_at_price}>
                <input id="compare_at_price" name="compare_at_price" className="input" inputMode="decimal" defaultValue={p?.compare_at_price ?? ""} dir="ltr" />
              </Field>
              <Field label="عدد القطع في المخزن" htmlFor="stock" error={s?.errors?.stock}>
                <input id="stock" name="stock" className="input" inputMode="numeric" defaultValue={p?.stock ?? 0} dir="ltr" />
              </Field>
              <Field label="نبّهني لما يقل عن" htmlFor="low_stock_at" hint="لما المخزون يوصل للرقم ده هيظهر في تنبيهات المخزون">
                <input id="low_stock_at" name="low_stock_at" className="input" inputMode="numeric" defaultValue={p?.low_stock_at ?? 3} dir="ltr" />
              </Field>
              <Field label="سعر الشراء (اختياري)" htmlFor="cost" hint="مش بيظهر للعميل، بيحسبلك المكسب" error={s?.errors?.cost}>
                <input id="cost" name="cost" className="input" inputMode="decimal" defaultValue={p?.cost ?? ""} dir="ltr" />
              </Field>
              <Field label="كود المنتج (اختياري)" htmlFor="sku">
                <input id="sku" name="sku" className="input" defaultValue={p?.sku ?? ""} dir="ltr" />
              </Field>
            </div>
          </section>

          <section className="card grid gap-3 p-4 sm:p-5">
            <h2 className="text-[22px]">الظهور في الموقع</h2>
            <Toggle name="is_active" label="ظاهر في الموقع" defaultChecked={p?.is_active ?? true} hint="لو شلت العلامة، المنتج بيستخبى من غير ما يتمسح" />
            <Toggle name="is_best_seller" label="من الأكثر مبيعاً" defaultChecked={p?.is_best_seller ?? false} />
            <Toggle name="is_trending" label="جديد / ترند" defaultChecked={p?.is_trending ?? false} hint="بيظهر في «وصل حديثاً» بعلامة «جديد»" />
          </section>

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            <SubmitButton className="btn btn-primary min-w-48">{p ? "احفظ التعديلات" : "أضف المنتج"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function DeleteProduct({ id }: { id: string }) {
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!sure) {
    return (
      <button type="button" className="btn btn-danger btn-sm" onClick={() => setSure(true)}>
        امسح المنتج
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#fdecec] p-3">
      <span className="text-[17px] font-bold text-sale">متأكد؟ مش هينفع ترجعه. (الطلبات القديمة مش هتتأثر)</span>
      <button
        type="button"
        disabled={busy}
        className="btn btn-sm bg-sale text-white"
        onClick={async () => {
          setBusy(true);
          await deleteProduct(id);
        }}
      >
        {busy ? "…" : "أيوه، امسحه"}
      </button>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setSure(false)}>
        لأ
      </button>
    </div>
  );
}
