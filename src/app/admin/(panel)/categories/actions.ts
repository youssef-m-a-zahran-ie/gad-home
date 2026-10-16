"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { bool, int, str } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { slugify } from "@/lib/format";
import { MEDIA_BUCKET } from "@/lib/supabase/env";

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

function image(fd: FormData): string | null {
  try {
    const v = JSON.parse(str(fd, "image") || "[]");
    return Array.isArray(v) && typeof v[0] === "string" ? v[0] : null;
  } catch {
    return null;
  }
}

export async function saveCategory(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const name = str(fd, "name");
  if (name.length < 2) return fail("اكتب اسم القسم", { name: "اكتب اسم القسم" });
  const parent_id = str(fd, "parent_id") || null;
  if (id && parent_id === id) return fail("القسم مينفعش يبقى جوه نفسه.");
  const row = {
    name,
    parent_id,
    image_path: image(fd),
    sort: int(fd, "sort", 0),
    is_active: bool(fd, "is_active"),
    show_on_home: bool(fd, "show_on_home"),
  };
  if (id) {
    const { data: old } = await supabase.from("categories").select("image_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("categories").update(row).eq("id", id);
    if (error) return fail(friendlyDbError(error));
    if (old?.image_path && old.image_path !== row.image_path) await supabase.storage.from(MEDIA_BUCKET).remove([old.image_path]);
  } else {
    const base = slugify(name);
    let slug = base;
    for (let i = 0; i < 5; i++) {
      const { data: taken } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
      if (!taken) break;
      slug = `${base}-${Math.random().toString(36).slice(2, 5)}`;
    }
    const { error } = await supabase.from("categories").insert({ ...row, slug });
    if (error) return fail(friendlyDbError(error));
  }
  refresh();
  return ok(id ? "اتحفظ ✓" : `قسم «${name}» اتضاف ✓`);
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const { data: old } = await supabase.from("categories").select("image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return fail(friendlyDbError(error));
  if (old?.image_path) await supabase.storage.from(MEDIA_BUCKET).remove([old.image_path]);
  refresh();
  return ok("القسم اتمسح. منتجاته بقت «بدون قسم».");
}
