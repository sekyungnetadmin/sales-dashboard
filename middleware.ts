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