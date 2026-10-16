import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | لوحة تحكم GAD Home" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-soft">{children}</div>;
}
