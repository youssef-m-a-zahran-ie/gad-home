import { CashIcon, ReturnIcon, ShieldIcon, TruckIcon } from "./icons";

export function TrustBadges({ deliveryDays, returnDays, compact = false }: { deliveryDays?: string | null; returnDays?: number; compact?: boolean }) {
  const items = [
    { Icon: CashIcon, title: "الدفع عند الاستلام", text: "ادفع كاش لما الطلب يوصلك" },
    { Icon: TruckIcon, title: "شحن لكل المحافظات", text: deliveryDays ? `التوصيل ${deliveryDays}` : "توصيل لحد باب البيت" },
    { Icon: ReturnIcon, title: "استبدال واسترجاع", text: `خلال ${returnDays ?? 14} يوم من الاستلام` },
    { Icon: ShieldIcon, title: "معاينة قبل الاستلام", text: "شوف طلبك قبل ما تدفع" },
  ];
  return (
    <ul className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
      {items.map(({ Icon, title, text }) => (
        <li key={title} className={`flex gap-3 rounded-2xl bg-sky p-3 sm:p-4 ${compact ? "items-center" : "flex-col items-center text-center sm:flex-row sm:text-start"}`}>
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy">
            <Icon size={26} />
          </span>
          <span>
            <span className="block text-[17px] leading-snug font-extrabold text-navy sm:text-[18px]">{title}</span>
            <span className="block text-[15px] leading-snug text-muted sm:text-base">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
