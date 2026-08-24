import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  let query = supabase
    .from("clients")
    .select("id, company_name, contact_name")
    .order("last_ordered_at", { ascending: false, nullsFirst: false })
    .limit(20);

  if (q.trim()) {
    query = query.ilike("company_name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ clients: data });
}