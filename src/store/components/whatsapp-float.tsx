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
      className="no-print fixed bottom-[84px] left-4 z-30 grid size-16 place-items-center rounded-full bg-[#1fa855] text-white shadow-lg hover:bg-[#178a45] lg:bottom-6"
      aria-label="كلمنا على واتساب"
    >
      <WhatsAppIcon size={34} />
    </a>
  );
}
