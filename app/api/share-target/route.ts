import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "";
  const text = searchParams.get("text") || "";
  const url = searchParams.get("url") || "";

  const params = new URLSearchParams({ title, text, url });
  return NextResponse.redirect(
    new URL(`/orders/test?${params.toString()}`, request.url)
  );
}