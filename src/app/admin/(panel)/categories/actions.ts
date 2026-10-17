"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { bool, int, str } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { slugify } from "@/lib/format";
import { dbError, one, query } from "@/lib/db";
import { removeFiles } from "@/lib/storage";

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
  await assertAdmin();
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
  try {
    if (id) {
      const old = await one<{ image_path: string | null }>("select image_path from categories where id = $1::uuid", [id]);
      await query(
        `update categories set name = $2, parent_id = $3::uuid, image_path = $4, sort = $5, is_active = $6, show_on_home = $7
         where id = $1::uuid`,
        [id, row.name, row.parent_id, row.image_path, row.sort, row.is_active, row.show_on_home],
      );
      if (old?.image_path && old.image_path !== row.image_path) await removeFiles([old.image_path]);
    } else {
      const base = slugify(name);
      let slug = base;
      for (let i = 0; i < 5; i++) {
        const taken = await one("select 1 from categories where slug = $1", [slug]);
        if (!taken) break;
        slug = `${base}-${Math.random().toString(36).slice(2, 5)}`;
      }
      await query(
        `insert into categories (name, slug, parent_id, image_path, sort, is_active, show_on_home)
         values ($1, $2, $3::uuid, $4, $5, $6, $7)`,
        [row.name, slug, row.parent_id, row.image_path, row.sort, row.is_active, row.show_on_home],
      );
    }
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  return ok(id ? "اتحفظ ✓" : `قسم «${name}» اتضاف ✓`);
}

export async function deleteCategory(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const old = await one<{ image_path: string | null }>("select image_path from categories where id = $1::uuid", [id]);
    await query("delete from categories where id = $1::uuid", [id]);
    await removeFiles([old?.image_path]);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  return ok("القسم اتمسح. منتجاته بقت «بدون قسم».");
}
