import { NextResponse, type NextRequest } from "next/server";

// Cheap gate for /admin: no session cookie → login page. The real check (is the session valid and
// is the email still an admin?) happens in requireAdmin()/assertAdmin() against the database.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin/login")) return NextResponse.next();
  if (!request.cookies.get("gad_admin")?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
