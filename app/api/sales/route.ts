import { NextResponse } from "next/server";

const SHEETS = [
  {
    name: "세경네트",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqNsxx1qCD7ohpT5q6VEUPjNjf5Shy5BIl50CXRJoe0D9RbpZcUVOuVCpp7-fduUToPRKotYb1lFhx/pub?gid=659491028&single=true&output=csv",
  },
  {
    name: "한두산업",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqNsxx1qCD7ohpT5q6VEUPjNjf5Shy5BIl50CXRJoe0D9RbpZcUVOuVCpp7-fduUToPRKotYb1lFhx/pub?gid=1498984344&single=true&output=csv",
  },
];

function findHeaderIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("거래처명") || lines[i].includes("사업자번호")) return i;
  }
  return 0;
}

export async function GET() {
  const results = await Promise.all(
    SHEETS.map(async ({ name, url }) => {
      const res = await fetch(url + `&t=${Date.now()}`, { cache: "no-store" });
      const text = await res.text();
      const lines = text.split("\n");
      const hi = findHeaderIndex(lines);
      const dataLines = lines.slice(hi);
      if (dataLines.length === 0) return { header: "", rows: [] as string[] };
      dataLines[0] = dataLines[0].trimEnd() + ",업체명";
      const rows = dataLines
        .slice(1)
        .filter((l) => l.trim())
        .map((l) => l.trimEnd() + `,${name}`);
      return { header: dataLines[0], rows };
    })
  );

  const header = results[0].header;
  const allRows = results.flatMap((r) => r.rows);
  const combined = [header, ...allRows].join("\n");

  return new NextResponse(combined, {
    headers: {
      "Content-Type": "text/csv",
      "Cache-Control": "no-store",
    },
  });
}