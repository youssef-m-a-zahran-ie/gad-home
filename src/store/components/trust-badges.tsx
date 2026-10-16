import { CashIcon, ReturnIcon, ShieldIcon, TruckIcon } from "./icons";

export function TrustBadges({
  deliveryDays,
  returnDays,
  compact = false,
  variant = "strip",
}: {
  deliveryDays?: string | null;
  returnDays?: number;
  compact?: boolean;
  variant?: "strip" | "cards";
}) {
  const items = [
    { Icon: CashIcon, title: "الدفع عند الاستلام", text: "ادفع كاش لما الطلب يوصلك" },
    { Icon: TruckIcon, title: "شحن لكل المحافظات", text: deliveryDays ? `التوصيل ${deliveryDays}` : "توصيل لحد باب البيت" },
    { Icon: ReturnIcon, title: "استبدال واسترجاع", text: `خلال ${returnDays ?? 14} يوم من الاستلام` },
    { Icon: ShieldIcon, title: "معاينة قبل الاستلام", text: "شوف طلبك قبل ما تدفع" },
  ];
  return variant === "cards" ? (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map(({ Icon, title, text }) => (
        <li key={title} className="grid justify-items-center gap-2 rounded-2xl bg-white px-3 py-6 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-sky text-navy">
            <Icon size={32} />
          </span>
          <span className="text-[18px] leading-snug font-extrabold text-ink">{title}</span>
          <span className="text-[16px] leading-snug text-muted">{text}</span>
        </li>
      ))}
    </ul>
  ) : (
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
