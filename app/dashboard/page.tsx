"use client";

import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ── 타입 ────────────────────────────────────────
interface Row {
  name: string;
  date: Date;
  year: number;
  month: number;
  amount: number;
}

// ── 색상 ─────────────────────────────────────────
const COLORS = ["#4f8ef7","#38d9a9","#f7a94f","#f75f7a","#a78bfa","#fb923c","#34d399","#f472b6","#60a5fa","#fbbf24"];

// ── 숫자 포맷 ─────────────────────────────────────
function fmt(n: number) {
  if (n >= 1e8) return (n / 1e8).toFixed(1) + "억";
  if (n >= 1e4) return Math.round(n / 1e4).toLocaleString() + "만";
  return n.toLocaleString();
}
function fmtFull(n: number) { return Math.round(n).toLocaleString() + "원"; }

// ── 커스텀 툴팁 ───────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e2333", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ color: "#8b90a8", fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {fmtFull(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── 메인 컴포넌트 ─────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<number | "all">("all");
  const [activeClient, setActiveClient] = useState<string>("all");
  const [uploadMode, setUploadMode] = useState(false);

  // 기본 CSV 로드
useEffect(() => {
  const SHEET_CSV_URL = "/api/sales";
  
  fetch(SHEET_CSV_URL)
    .then(r => {
      if (!r.ok) throw new Error("fetch failed");
      return r.text();
    })
    .then(text => {
      console.log("가져온 데이터 첫줄:", text.split("\n")[0]);
      console.log("가져온 데이터 둘째줄:", text.split("\n")[1]);
      const lines = text.split("\n");
      let hi = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("거래처명") || lines[i].includes("사업자번호")) { hi = i; break; }
      }
      console.log("헤더 위치:", hi, "헤더:", lines[hi]);
      parseCSV(lines.slice(hi).join("\n"));
      setLoading(false);
    })
    .catch((e) => { 
      console.error("에러:", e); 
      setLoading(false); 
    });
}, []);


  function parseCSV(text: string) {
    const result = Papa.parse<any>(text, { header: true, skipEmptyLines: true });
    const rows: Row[] = [];
    result.data.forEach((r: any) => {
      const name = (r["거래처명"] || r["name"] || "").trim();
      const dateStr = (r["발행일자"] || r["date"] || "").trim();
      const amount = parseFloat((r["공급가액"] || r["amount"] || "0").replace(/,/g, ""));
      if (!name || !dateStr || isNaN(amount)) return;
      const date = new Date(dateStr.replace(/\./g, "-"));
      if (isNaN(date.getTime())) return;
      rows.push({ name, date, year: date.getFullYear(), month: date.getMonth() + 1, amount });
    });
    setData(rows);
    setActiveYear("all");
    setActiveClient("all");
  }

  // 파일 업로드
  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const ab = e.target?.result as ArrayBuffer;
      // EUC-KR 시도
      try {
        const dec = new TextDecoder("euc-kr");
        let text = dec.decode(new Uint8Array(ab));
        // 헤더 찾기
        const lines = text.split("\n");
        let hi = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("거래처명") || lines[i].includes("사업자번호")) { hi = i; break; }
        }
        parseCSV(lines.slice(hi).join("\n"));
      } catch {
        const dec2 = new TextDecoder("utf-8");
        parseCSV(dec2.decode(new Uint8Array(ab)));
      }
      setUploadMode(false);
    };
    reader.readAsArrayBuffer(file);
  }

  // 필터된 데이터
  const filtered = useMemo(() => data.filter(d => {
    const yOk = activeYear === "all" || d.year === activeYear;
    const cOk = activeClient === "all" || d.name === activeClient;
    return yOk && cOk;
  }), [data, activeYear, activeClient]);

  const years = useMemo(() => [...new Set(data.map(d => d.year))].sort(), [data]);

  const topClients = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => { map[d.name] = (map[d.name] || 0) + d.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
  }, [data]);

  // KPI
  const total = filtered.reduce((s, d) => s + d.amount, 0);
  const count = filtered.length;
  const clients = new Set(filtered.map(d => d.name)).size;
  const months = new Set(filtered.map(d => `${d.year}-${d.month}`)).size || 1;
  const avg = total / months;

  // 월별 추이 데이터
  const trendData = useMemo(() => {
    const activeYears = activeYear === "all" ? years : [activeYear];
    return Array.from({ length: 12 }, (_, m) => {
      const obj: any = { month: `${m + 1}월` };
      activeYears.forEach(y => {
        obj[`${y}년`] = filtered.filter(d => d.year === y && d.month === m + 1).reduce((s, d) => s + d.amount, 0);
      });
      return obj;
    });
  }, [filtered, years, activeYear]);

  // 거래처 파이
  const pieData = useMemo(() => {
    const top = activeYear === "all" ? topClients : [...new Set(filtered.map(d => d.name))].slice(0, 8);
    return top.map(name => ({
      name,
      value: filtered.filter(d => d.name === name).reduce((s, d) => s + d.amount, 0)
    })).filter(d => d.value > 0);
  }, [filtered, topClients, activeYear]);

  // 연도별 바
  const yearData = useMemo(() => years.map(y => ({
    year: `${y}년`,
    매출: filtered.filter(d => d.year === y).reduce((s, d) => s + d.amount, 0)
  })), [filtered, years]);

  // 거래처 테이블
  const tableData = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    filtered.forEach(d => {
      if (!map[d.name]) map[d.name] = { amount: 0, count: 0 };
      map[d.name].amount += d.amount;
      map[d.name].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, [filtered]);

  const maxAmt = tableData[0]?.[1].amount || 1;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#4f8ef7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#8b90a8", fontSize: 14 }}>데이터 로딩 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    background: "#181c27", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: 24
  };

  const activeYears = activeYear === "all" ? years : [activeYear as number];

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>
      {/* 탑바 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0f1117", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 3, color: "#4f8ef7", fontWeight: 600 }}>SEKYUNG</span>
          <span style={{ color: "#5a5f78", fontSize: 14 }}>매출 대시보드</span>
        </div>
        <button
          onClick={() => setUploadMode(true)}
          style={{ padding: "8px 18px", background: "#1e2333", border: "1px solid rgba(255,255,255,0.1)", color: "#8b90a8", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "Noto Sans KR, sans-serif" }}
        >
          📂 CSV 업데이트
        </button>
      </div>

      {/* 업로드 모달 */}
      {uploadMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setUploadMode(false)}>
          <div style={{ ...cardStyle, width: 400, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>CSV 파일 올리기</p>
            <p style={{ color: "#8b90a8", fontSize: 13, marginBottom: 24 }}>이지폼에서 내보낸 CSV 파일을 선택하세요</p>
            <label style={{ display: "block", border: "2px dashed rgba(79,142,247,0.4)", borderRadius: 12, padding: "40px 24px", cursor: "pointer", background: "rgba(79,142,247,0.05)" }}>
              <input type="file" accept=".csv" style={{ display: "none" }}
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              <span style={{ fontSize: 36 }}>📂</span>
              <p style={{ marginTop: 12, color: "#e8eaf2", fontSize: 14 }}>클릭해서 파일 선택</p>
            </label>
            <button onClick={() => setUploadMode(false)}
              style={{ marginTop: 16, padding: "8px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#8b90a8", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "Noto Sans KR, sans-serif" }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 필터 바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#181c27", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1, fontWeight: 600 }}>연도</span>
        {(["all", ...years] as (number | "all")[]).map(y => (
          <button key={y} onClick={() => setActiveYear(y)}
            style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${activeYear === y ? "#4f8ef7" : "rgba(255,255,255,0.1)"}`, background: activeYear === y ? "#4f8ef7" : "transparent", color: activeYear === y ? "#fff" : "#8b90a8", fontSize: 13, cursor: "pointer", fontFamily: "Noto Sans KR, sans-serif", fontWeight: activeYear === y ? 600 : 400 }}>
            {y === "all" ? "전체" : `${y}년`}
          </button>
        ))}
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <span style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1, fontWeight: 600 }}>거래처</span>
        {(["all", ...topClients] as string[]).map(c => (
          <button key={c} onClick={() => setActiveClient(c)}
            style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${activeClient === c ? "#4f8ef7" : "rgba(255,255,255,0.1)"}`, background: activeClient === c ? "#4f8ef7" : "transparent", color: activeClient === c ? "#fff" : "#8b90a8", fontSize: 13, cursor: "pointer", fontFamily: "Noto Sans KR, sans-serif", fontWeight: activeClient === c ? 600 : 400, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c === "all" ? "전체" : c}
          </button>
        ))}
      </div>

      {/* 메인 */}
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400, margin: "0 auto" }}>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { label: "총 매출 (공급가액)", value: fmt(total), sub: fmtFull(total), color: "#4f8ef7" },
            { label: "거래 건수", value: count.toLocaleString() + "건", sub: "세금계산서 발행", color: "#38d9a9" },
            { label: "거래처 수", value: clients + "개사", sub: "활성 거래처", color: "#f7a94f" },
            { label: "월 평균 매출", value: fmt(avg), sub: fmtFull(avg), color: "#f75f7a" },
          ].map((k, i) => (
            <div key={i} style={{ ...cardStyle, borderTop: `2px solid ${k.color}` }}>
              <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>{k.label}</p>
              <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{k.value}</p>
              <p style={{ fontSize: 12, color: "#5a5f78" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* 월별 추이 */}
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>📈 월별 매출 추이</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#5a5f78", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5a5f78", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8b90a8" }} />
              {activeYears.map((y, i) => (
                <Line key={y} type="monotone" dataKey={`${y}년`} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 파이 + 연도별 바 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>🏢 거래처별 매출 비중</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ background: "#1e2333", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8b90a8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>📊 연도별 매출 합계</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: "#8b90a8", fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5a5f78", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="매출" radius={[8, 8, 0, 0]}>
                  {yearData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 거래처 테이블 */}
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>🏆 거래처별 매출 순위 <span style={{ fontSize: 12, color: "#5a5f78", fontWeight: 400 }}>총 {tableData.length}개사</span></p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["#", "거래처명", "공급가액", "거래건수", "비중", "비율"].map((h, i) => (
                    <th key={i} style={{ textAlign: i >= 2 && i <= 4 ? "right" : i === 5 ? "left" : "left", padding: "10px 14px", color: "#5a5f78", fontSize: 11, fontWeight: 600, letterSpacing: 1, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map(([name, v], i) => {
                  const pct = (v.amount / total * 100).toFixed(1);
                  const barW = (v.amount / maxAmt * 100).toFixed(1);
                  return (
                    <tr key={name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "11px 14px", color: "#5a5f78", fontFamily: "monospace", fontSize: 12, width: 40 }}>{i + 1}</td>
                      <td style={{ padding: "11px 14px", color: "#e8eaf2", fontWeight: 500 }}>{name}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "monospace", color: "#e8eaf2" }}>{fmtFull(v.amount)}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", color: "#8b90a8" }}>{v.count}건</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", color: "#5a5f78" }}>{pct}%</td>
                      <td style={{ padding: "11px 14px", minWidth: 120 }}>
                        <div style={{ height: 4, background: "#1e2333", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${barW}%`, background: COLORS[i % COLORS.length], borderRadius: 2 }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#5a5f78", fontSize: 12, paddingBottom: 16 }}>
          데이터 기간: {data.length > 0 ? `${Math.min(...data.map(d => d.year))}년 ~ ${Math.max(...data.map(d => d.year))}년` : "-"}
          {" · "}총 {data.length.toLocaleString()}건
        </p>
      </div>
    </div>
  );
}
