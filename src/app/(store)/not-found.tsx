import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page grid justify-items-center gap-4 py-20 text-center">
      <p className="text-[28px] font-extrabold text-navy">الصفحة دي مش موجودة</p>
      <p className="text-[19px] text-muted">ممكن المنتج اتشال أو الرابط فيه غلطة.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">الرئيسية</Link>
        <Link href="/categories" className="btn btn-outline">كل الأقسام</Link>
      </div>
    </div>
  );
}
