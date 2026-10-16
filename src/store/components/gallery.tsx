"use client";

import { useState } from "react";
import { ProductImage } from "./product-image";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (images.length <= 1) {
    return <ProductImage path={images[0]} alt={name} eager className="aspect-square w-full rounded-2xl border border-line p-3" />;
  }
  return (
    <div className="grid gap-3">
      <ProductImage path={images[i]} alt={`${name} - صورة ${i + 1}`} eager className="aspect-square w-full rounded-2xl border border-line p-3" />
      <ul className="no-scrollbar flex gap-2 overflow-x-auto">
        {images.map((p, n) => (
          <li key={p} className="shrink-0">
            <button
              type="button"
              onClick={() => setI(n)}
              className={`block overflow-hidden rounded-xl border-[3px] ${n === i ? "border-blue" : "border-line"}`}
              aria-label={`عرض صورة ${n + 1}`}
              aria-pressed={n === i}
            >
              <ProductImage path={p} alt="" className="size-20 p-1" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
