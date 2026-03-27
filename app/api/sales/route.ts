import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqNsxx1qCD7ohpT5q6VEUPjNjf5Shy5BIl50CXRJoe0D9RbpZcUVOuVCpp7-fduUToPRKotYb1lFhx/pub?gid=659491028&single=true&output=csv";
  
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  
  return new NextResponse(text, {
    headers: { 
      "Content-Type": "text/csv",
      "Cache-Control": "no-store"
    },
  });
}