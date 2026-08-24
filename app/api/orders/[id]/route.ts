import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { client_id, company, shipping_date, processed_by } = body;

  const { error } = await supabase
    .from("orders")
    .update({
      client_id,
      company,
      shipping_date,
      status: "발주확인",
      processed_by,
      processed_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("order_count")
      .eq("id", client_id)
      .single();

    await supabase
      .from("clients")
      .update({
        last_ordered_at: new Date().toISOString(),
        order_count: (client?.order_count || 0) + 1,
      })
      .eq("id", client_id);
  }

  return NextResponse.json({ ok: true });
}