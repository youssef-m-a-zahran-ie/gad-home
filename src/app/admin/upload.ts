"use server";

import { assertAdmin } from "@/lib/admin/guard";
import { putPublic } from "@/lib/storage";

const FOLDERS = new Set(["products", "categories", "banners", "brand"]);

/** Receives a WebP made in the browser and stores it in the media bucket. Returns the public URL. */
export async function uploadImageAction(fd: FormData): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  await assertAdmin();
  const file = fd.get("file");
  const folder = String(fd.get("folder") ?? "");
  if (!(file instanceof File) || !FOLDERS.has(folder)) return { ok: false, message: "ملف غلط." };
  if (file.type !== "image/webp") return { ok: false, message: "الصورة لازم تكون WebP." };
  if (file.size > 3_500_000) return { ok: false, message: "الصورة كبيرة قوي." };
  try {
    const path = await putPublic(`${folder}/${crypto.randomUUID()}.webp`, await file.arrayBuffer(), "image/webp");
    return { ok: true, path };
  } catch {
    return { ok: false, message: "الرفع فشل." };
  }
}
