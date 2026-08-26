import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const today = toDateStr(new Date());

  const { count: pendingCount, error: e1 } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "미처리");

  const { count: todayCount, error: e2 } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("shipping_date", today)
    .neq("status", "출고완료");

  if (e1 || e2) {
    return NextResponse.json({ error: (e1 || e2)?.message }, { status: 500 });
  }

  return NextResponse.json({
    pending: pendingCount || 0,
    todayShipping: todayCount || 0,
  });
}