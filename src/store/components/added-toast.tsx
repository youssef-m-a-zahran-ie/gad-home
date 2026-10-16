"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "../cart";
import { CheckIcon, XIcon } from "./icons";
import { ProductImage } from "./product-image";

/** After "Add to cart": a clear message with the two next steps. */
export function AddedToast() {
  const { added, dismissAdded, count } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(dismissAdded, 7000);
    return () => clearTimeout(t);
  }, [added, dismissAdded]);

  useEffect(() => {
    dismissAdded();
  }, [pathname, dismissAdded]);

  if (!added) return null;
  return (
    <div className="no-print fixed inset-x-0 bottom-[76px] z-50 px-3 lg:bottom-6" role="status" aria-live="polite">
      <div key={added.at} className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border-2 border-ok bg-white p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <ProductImage path={added.image} alt="" className="size-16 shrink-0 rounded-xl border border-line" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[19px] font-extrabold text-ok">
              <CheckIcon size={24} /> اتضاف للسلة
            </p>
            <p className="truncate text-[17px] text-ink">{added.name}</p>
          </div>
          <button type="button" onClick={dismissAdded} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-soft" aria-label="إغلاق">
            <XIcon size={24} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={dismissAdded} className="btn btn-outline btn-sm">
            كمّل تسوق
          </button>
          <Link href="/cart" className="btn btn-primary btn-sm">
            السلة ({count})
          </Link>
        </div>
      </div>
    </div>
  );
}
