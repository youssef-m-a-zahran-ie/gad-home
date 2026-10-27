"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "./icons";

export function WhatsAppFloat({ href }: { href: string | null }) {
  const pathname = usePathname();
  if (!href || pathname.startsWith("/checkout")) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`no-print fixed bottom-[82px] left-3 z-30 grid size-14 place-items-center rounded-full bg-[#25804c] text-white shadow-md transition-colors hover:bg-[#1d683d] lg:bottom-6 lg:left-4 lg:size-16 ${pathname === "/" ? "hidden lg:grid" : ""}`}
      aria-label="كلمنا على واتساب"
    >
      <WhatsAppIcon size={34} />
    </a>
  );
}
