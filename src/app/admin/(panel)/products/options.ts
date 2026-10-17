import type { CategoryRow } from "@/lib/types";

export type CatOption = Pick<CategoryRow, "id" | "name" | "parent_id">;

/** Categories for a dropdown: each main category followed by its sub-categories. */
export function categoryOptions(cats: CatOption[]) {
  const tops = cats.filter((c) => !c.parent_id);
  const out: { id: string; label: string }[] = [];
  for (const t of tops) {
    out.push({ id: t.id, label: t.name });
    for (const k of cats.filter((c) => c.parent_id === t.id)) out.push({ id: k.id, label: `— ${k.name}` });
  }
  for (const c of cats) if (!out.some((o) => o.id === c.id)) out.push({ id: c.id, label: c.name });
  return out;
}
