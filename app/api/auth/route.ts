import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  const correct = process.env.DASHBOARD_PASSWORD;

  if (!correct) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (password === correct) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}