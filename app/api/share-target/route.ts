import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "";

  if (text.trim()) {
    await supabase.from("orders").insert({ raw_text: text });
  }

  return NextResponse.redirect(new URL("/orders/test?saved=1", request.url));
}