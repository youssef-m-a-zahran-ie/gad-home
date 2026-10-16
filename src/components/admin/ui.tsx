import Link from "next/link";
import type { ReactNode } from "react";
import type { OrderStatus } from "@/lib/supabase/database.types";

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] sm:text-[32px]">{title}</h1>
        {sub && <p className="text-[17px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  new: { label: "جديد", cls: "bg-blue text-white" },
  confirmed: { label: "اتأكد", cls: "bg-[#7c3aed] text-white" },
  shipped: { label: "اتشحن", cls: "bg-warn text-white" },
  delivered: { label: "اتسلّم", cls: "bg-ok text-white" },
  cancelled: { label: "اتلغى", cls: "bg-[#6b7280] text-white" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card p-4 sm:p-5 ${className}`}>{children}</section>;
}

export function Empty({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-2xl bg-soft px-4 py-12 text-center">
      <p className="text-[19px] font-bold text-muted">{text}</p>
      {href && cta && (
        <Link href={href} className="btn btn-primary">
          {cta}
        </Link>
      )}
    </div>
  );
}
