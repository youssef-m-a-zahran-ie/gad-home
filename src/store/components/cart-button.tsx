"use client";

import Link from "next/link";
import { num } from "@/lib/format";
import { useCart } from "../cart";
import { CartIcon } from "./icons";

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex min-h-[52px] items-center gap-2 rounded-full px-3 font-bold text-ink hover:bg-soft sm:px-4"
      aria-label={`السلة، فيها ${count} منتج`}
    >
      <span className="relative">
        <CartIcon size={30} />
        {ready && count > 0 && (
          <span className="absolute -top-2.5 -left-3 grid min-w-7 place-items-center rounded-full bg-sale px-1.5 text-[15px] leading-7 font-extrabold text-white">
            {num(count)}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">السلة</span>
    </Link>
  );
}
