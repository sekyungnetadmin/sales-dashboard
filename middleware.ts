import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const auth = req.cookies.get("auth")?.value;
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/api/share-target") ||
    pathname.startsWith("/api/clients") ||
    pathname.startsWith("/api/orders") ||
    pathname === "/manifest.json" ||
    pathname === "/icon-192.png" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  if (!auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};