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
      className="relative inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-sky px-3 font-bold text-navy hover:bg-sky-2 sm:px-4"
      aria-label={`السلة، فيها ${count} منتج`}
    >
      <CartIcon size={28} />
      <span className="hidden sm:inline">السلة</span>
      {ready && count > 0 && (
        <span className="absolute -top-2 -left-2 grid min-w-7 place-items-center rounded-full bg-sale px-1.5 text-[15px] leading-7 font-extrabold text-white">
          {num(count)}
        </span>
      )}
    </Link>
  );
}
