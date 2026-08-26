import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("orders")
    .select("id, raw_text, status, shipping_date, company, clients(company_name)")
    .not("shipping_date", "is", null)
    .neq("status", "출고완료")
    .order("shipping_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}