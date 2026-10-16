import Link from "next/link";
import { mediaUrl } from "@/lib/supabase/env";

export function Logo({ name, logoPath, light = false }: { name: string; logoPath?: string | null; light?: boolean }) {
  const src = mediaUrl(logoPath);
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${name}، الصفحة الرئيسية`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-12 w-auto max-w-[160px] object-contain" />
      ) : (
        <>
          <span className={`grid size-11 place-items-center rounded-xl ${light ? "bg-white text-navy" : "bg-navy text-white"}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 11 12 4l9 7" />
              <path d="M5.5 9.5V20h13V9.5" />
              <path d="M10 20v-5h4v5" />
            </svg>
          </span>
          <span dir="ltr" className={`text-[24px] leading-none font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}>
            {name}
          </span>
        </>
      )}
    </Link>
  );
}
