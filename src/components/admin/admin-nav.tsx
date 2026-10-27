"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "الرئيسية" },
  { href: "/admin/orders", label: "الطلبات" },
  { href: "/admin/products", label: "المنتجات" },
  { href: "/admin/inventory", label: "المخزون" },
  { href: "/admin/categories", label: "الأقسام" },
  { href: "/admin/shipping", label: "الشحن" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export function AdminNav({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام لوحة التحكم" >
      <ul className="flex flex-wrap gap-1 lg:flex-col lg:gap-1">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center justify-between gap-2 rounded-lg px-2.5 text-[15px] font-bold lg:min-h-[48px] lg:rounded-xl lg:px-4 lg:text-[16px] ${
                  active ? "bg-navy text-white" : "bg-sky text-navy hover:bg-sky-2 lg:bg-transparent"
                }`}
              >
                {l.label}
                {l.href === "/admin/orders" && newOrders > 0 && (
                  <span className="grid min-w-7 place-items-center rounded-full bg-sale px-1.5 text-[15px] leading-7 text-white">{newOrders}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
