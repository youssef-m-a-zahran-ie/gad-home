"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, Field, Notice, SubmitButton, Toggle } from "@/components/admin/form-bits";
import { ImagePicker } from "@/components/admin/image-picker";
import type { ActionState } from "@/lib/admin/state";
import type { CategoryRow } from "@/lib/supabase/database.types";
import { deleteCategory, saveCategory } from "./actions";

type Cat = Pick<CategoryRow, "id" | "name" | "parent_id" | "image_path" | "sort" | "is_active" | "show_on_home" | "slug">;

export function CategoryForm({ cat, tops, onDone }: { cat: Cat | null; tops: Cat[]; onDone?: () => void }) {
  return (
    <ActionForm action={saveCategory.bind(null, cat?.id ?? null)} className="grid gap-4" resetOnSuccess={!cat} onSuccess={() => onDone?.()}>
      {(s) => (
        <>
          <Field label="اسم القسم" htmlFor={`n-${cat?.id ?? "new"}`} error={s?.errors?.name}>
            <input id={`n-${cat?.id ?? "new"}`} name="name" className="input" defaultValue={cat?.name ?? ""} placeholder="مثلاً: الصواني" />
          </Field>
          <Field label="جوه قسم تاني؟" htmlFor={`p-${cat?.id ?? "new"}`} hint="لو ده قسم فرعي (زي «صواني ستانلس» جوه «الصواني») اختار القسم الكبير">
            <select id={`p-${cat?.id ?? "new"}`} name="parent_id" className="input" defaultValue={cat?.parent_id ?? ""}>
              <option value="">لأ، قسم رئيسي</option>
              {tops.filter((t) => t.id !== cat?.id).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="صورة القسم (اختياري)">
            <ImagePicker key={s?.at ?? 0} name="image" initial={cat?.image_path ? [cat.image_path] : []} folder="categories" max={1} />
          </Field>
          <Field label="الترتيب" htmlFor={`o-${cat?.id ?? "new"}`} hint="الرقم الأصغر بيظهر الأول">
            <input id={`o-${cat?.id ?? "new"}`} name="sort" inputMode="numeric" className="input w-32" defaultValue={cat?.sort ?? 0} dir="ltr" />
          </Field>
          <Toggle name="is_active" label="ظاهر في الموقع" defaultChecked={cat?.is_active ?? true} />
          <Toggle name="show_on_home" label="يظهر كقسم في الصفحة الرئيسية" defaultChecked={cat?.show_on_home ?? true} />
          <SubmitButton className="btn btn-primary w-fit">{cat ? "احفظ" : "+ أضف القسم"}</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function CategoryRowItem({ cat, tops, count, child }: { cat: Cat; tops: Cat[]; count: number; child?: boolean }) {
  const [open, setOpen] = useState(false);
  const [sure, setSure] = useState(false);
  const [state, setState] = useState<ActionState>(null);
  const router = useRouter();
  return (
    <li className={`card p-3 sm:p-4 ${child ? "ms-6 border-r-4 border-r-sky-2" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[19px] font-bold">{cat.name}</p>
          <p className="text-[15px] text-muted">
            {count} منتج {!cat.is_active && "• مخفي"} {cat.show_on_home && !child && "• في الرئيسية"}
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen((o) => !o)}>
          {open ? "قفل" : "تعديل"}
        </button>
      </div>
      {open && (
        <div className="mt-4 grid gap-4 border-t border-line pt-4">
          <CategoryForm cat={cat} tops={tops} onDone={() => { setOpen(false); router.refresh(); }} />
          {!sure ? (
            <button type="button" className="btn btn-danger btn-sm w-fit" onClick={() => setSure(true)}>امسح القسم</button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#fdecec] p-3">
              <span className="text-[17px] font-bold text-sale">متأكد؟ المنتجات مش هتتمسح، هتبقى بدون قسم.</span>
              <button type="button" className="btn btn-sm bg-sale text-white" onClick={async () => { setState(await deleteCategory(cat.id)); router.refresh(); }}>أيوه، امسح</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSure(false)}>لأ</button>
            </div>
          )}
          <Notice state={state} />
        </div>
      )}
    </li>
  );
}
