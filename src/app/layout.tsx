import type { Metadata, Viewport } from "next";
import "./fonts";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "GAD Home | أدوات منزلية", template: "%s | GAD Home" },
  description: "أدوات منزلية ومطبخ: رفايع، صواني، أدوات تنظيف وأدوات مائدة. الدفع عند الاستلام والشحن لكل محافظات مصر.",
};

export const viewport: Viewport = { themeColor: "#0b3a6e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="antialiased">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
