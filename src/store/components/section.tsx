import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "./icons";

export function Section({ title, href, children, tone = "white" }: { title: string; href?: string; children: ReactNode; tone?: "white" | "soft" }) {
  return (
    <section className={tone === "soft" ? "bg-soft py-8 sm:py-10" : "py-8 sm:py-10"}>
      <div className="container-page">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-[23px] text-ink sm:text-[30px]">{title}</h2>
          {href && (
            <Link
              href={href}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-[17px] font-bold text-ink underline decoration-2 underline-offset-8 hover:text-blue"
            >
              عرض كل المنتجات <ChevronLeft size={20} />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="أنت هنا" className="container-page pt-4">
      <ol className="flex flex-wrap items-center gap-1 text-[16px] text-muted">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronLeft size={16} />}
            {it.href ? (
              <Link href={it.href} className="hover:text-blue hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="font-bold text-ink">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-3xl bg-soft px-6 py-14 text-center">
      <p className="text-[24px] font-extrabold text-navy">{title}</p>
      {text && <p className="max-w-md text-[18px] text-muted">{text}</p>}
      {action}
    </div>
  );
}
