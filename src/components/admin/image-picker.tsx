"use client";

import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/media";
import { uploadImageAction } from "@/app/admin/upload";

const MAX_SIDE = 1600;

/** Resizes a photo in the browser and saves it as WebP, so the store stays fast on phones. */
export async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
  if (!blob) throw new Error("encode");
  return blob;
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await toWebp(file);
  const fd = new FormData();
  fd.set("file", new File([blob], "image.webp", { type: "image/webp" }));
  fd.set("folder", folder);
  const res = await uploadImageAction(fd);
  if (!res.ok) throw new Error(res.message);
  return res.path;
}

/**
 * Pick, order and remove photos. The list goes to the server action as JSON in a hidden input
 * named `name`; the first photo is the main one.
 */
export function ImagePicker({ name, initial, folder, max = 12 }: { name: string; initial: string[]; folder: string; max?: number }) {
  const [list, setList] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function add(files: FileList) {
    setErr(null);
    const picked = [...files].filter((f) => f.type.startsWith("image/")).slice(0, max - list.length);
    const failed: string[] = [];
    for (const [i, f] of picked.entries()) {
      setBusy(`بيرفع صورة ${i + 1} من ${picked.length}…`);
      try {
        const path = await uploadImage(f, folder);
        setList((l) => [...l, path]);
      } catch {
        failed.push(f.name);
      }
    }
    setBusy(null);
    if (failed.length) setErr(`الصور دي مترفعتش: ${failed.join("، ")}. جرب تاني.`);
    if (input.current) input.current.value = "";
  }

  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[i], n[j]] = [n[j], n[i]];
    setList(n);
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name={name} value={JSON.stringify(list)} />
      {list.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {list.map((p, i) => (
            <li key={p} className="grid gap-2 rounded-xl border-2 border-line bg-white p-2">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(p)!} alt="" className="aspect-square w-full rounded-lg object-contain" />
                {i === 0 && <span className="badge absolute top-1 right-1 bg-navy text-white">الصورة الأساسية</span>}
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-outline btn-sm flex-1 px-1 disabled:opacity-30" aria-label="قدّم الصورة">
                  →
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="btn btn-outline btn-sm flex-1 px-1 disabled:opacity-30" aria-label="أخّر الصورة">
                  ←
                </button>
                <button type="button" onClick={() => setList((l) => l.filter((x) => x !== p))} className="btn btn-danger btn-sm flex-1 px-1">
                  شيل
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {list.length < max && (
        <label className={`grid cursor-pointer justify-items-center gap-1 rounded-2xl border-2 border-dashed border-blue/50 bg-sky px-4 py-6 text-center hover:bg-sky-2 ${busy ? "pointer-events-none opacity-60" : ""}`}>
          <span className="text-[19px] font-extrabold text-navy">{busy ?? "+ اختار صور من الموبايل أو الكمبيوتر"}</span>
          <span className="text-[15px] text-muted">تقدر تختار كذا صورة مرة واحدة. أول صورة هي اللي بتظهر في الموقع.</span>
          <input ref={input} type="file" accept="image/*" multiple className="sr-only" disabled={Boolean(busy)} onChange={(e) => e.target.files && add(e.target.files)} />
        </label>
      )}
      {err && <p className="field-error">{err}</p>}
    </div>
  );
}
