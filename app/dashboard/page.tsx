"use client";

import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface Row {
  name: string;
  date: Date;
  year: number;
  month: number;
  amount: number;
}

const COLORS = ["#4f8ef7","#38d9a9","#f7a94f","#f75f7a","#a78bfa","#fb923c","#34d399","#f472b6","#60a5fa","#fbbf24"];

function fmt(n: number) {
  if (n >= 1e8) return (n / 1e8).toFixed(1) + "억";
  if (n >= 1e4) return Math.round(n / 1e4).toLocaleString() + "만";
  return n.toLocaleString();
}
function fmtFull(n: number) { return Math.round(n).toLocaleString() + "원"; }

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

const selectStyle: React.CSSProperties = {
  padding: "7px 14px",
  background: "#1e2333",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#e8eaf2",
  borderRadius: 8,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "Noto Sans KR, sans-serif",
  outline: "none",
  minWidth: 110,
};

export default function Dashboard() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<number | "all">("all");
  const [activeClient, setActiveClient] = useState<string>("all");


  useEffect(() => {
    fetch("/api/sales")
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.text(); })
      .then(text => {
        const lines = text.split("\n");
        let hi = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("거래처명") || lines[i].includes("사업자번호")) { hi = i; break; }
        }
        parseCSV(lines.slice(hi).join("\n"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const filtered = useMemo(() => data.filter(d => {
    const yOk = activeYear === "all" || d.year === activeYear;
    const cOk = activeClient === "all" || d.name === activeClient;
    return yOk && cOk;
  }), [data, activeYear, activeClient]);

  const years = useMemo(() => [...new Set(data.map(d => d.year))].sort(), [data]);
  const allClients = useMemo(() => [...new Set(data.map(d => d.name))].sort(), [data]);

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

  // 전년 대비 증감률
  const currentYear = activeYear === "all" ? Math.max(...(years.length ? years : [0])) : activeYear as number;
  const prevYear = currentYear - 1;
  const currentTotal = data.filter(d => d.year === currentYear && (activeClient === "all" || d.name === activeClient)).reduce((s, d) => s + d.amount, 0);
  const prevTotal = data.filter(d => d.year === prevYear && (activeClient === "all" || d.name === activeClient)).reduce((s, d) => s + d.amount, 0);
  const growthRate = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100) : null;
  const growthColor = growthRate !== null ? (growthRate >= 0 ? "#38d9a9" : "#f75f7a") : "#5a5f78";
  const growthStr = growthRate !== null
    ? `${growthRate >= 0 ? "▲" : "▼"} 전년比 ${Math.abs(growthRate).toFixed(1)}%`
    : "전년 데이터 없음";

  // 차트 데이터 - 특정 연도 선택시 전년도도 함께 표시
  const activeYears = activeYear === "all" ? years : [prevYear, activeYear as number].filter(y => years.includes(y) || y === activeYear);

  const trendData = useMemo(() => {
    const chartYears = activeYear === "all" ? years : [prevYear, activeYear as number];
    return Array.from({ length: 12 }, (_, m) => {
      const obj: any = { month: `${m + 1}월` };
      chartYears.forEach(y => {
        const clientFilter = activeClient === "all" ? data : data.filter(d => d.name === activeClient);
        obj[`${y}년`] = clientFilter.filter(d => d.year === y && d.month === m + 1).reduce((s, d) => s + d.amount, 0);
      });
      return obj;
    });
  }, [data, years, activeYear, activeClient, prevYear]);

const pieData = useMemo(() => {
  const map: Record<string, number> = {};
  filtered.forEach(d => { map[d.name] = (map[d.name] || 0) + d.amount; });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
}, [filtered]);

const yearData = useMemo(() => years.map(y => ({
  year: `${y}년`,
  매출: data.filter(d => d.year === y && (activeClient === "all" || d.name === activeClient)).reduce((s, d) => s + d.amount, 0)
})), [data, years, activeClient]);

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

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>
      {/* 탑바 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0f1117", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 3, color: "#4f8ef7", fontWeight: 600 }}>SEKYUNG</span>
          <span style={{ color: "#5a5f78", fontSize: 14 }}>매출 대시보드</span>
        </div>

      </div>

      {/* 필터 바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#181c27", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1, fontWeight: 600 }}>연도</span>
        <select value={activeYear} onChange={e => setActiveYear(e.target.value === "all" ? "all" : Number(e.target.value))} style={selectStyle}>
          <option value="all">전체</option>
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>

        <span style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1, fontWeight: 600 }}>거래처</span>
        <select value={activeClient} onChange={e => setActiveClient(e.target.value)} style={{ ...selectStyle, minWidth: 180 }}>
          <option value="all">전체</option>
          {allClients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {activeYear !== "all" || activeClient !== "all" ? (
          <button onClick={() => { setActiveYear("all"); setActiveClient("all"); }}
            style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#5a5f78", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "Noto Sans KR, sans-serif" }}>
            초기화
          </button>
        ) : null}
      </div>

      {/* 메인 */}
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400, margin: "0 auto" }}>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {/* 총 매출 - 전년 대비 증감률 포함 */}
          <div style={{ ...cardStyle, borderTop: "2px solid #4f8ef7" }}>
            <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>총 매출 (공급가액)</p>
            <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{fmt(total)}</p>
            <p style={{ fontSize: 12, color: "#5a5f78" }}>{fmtFull(total)}</p>
            <p style={{ fontSize: 12, color: growthColor, marginTop: 8, fontWeight: 600 }}>{growthStr}</p>
          </div>
          {/* 거래 건수 */}
          <div style={{ ...cardStyle, borderTop: "2px solid #38d9a9" }}>
            <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>거래 건수</p>
            <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{count.toLocaleString()}건</p>
            <p style={{ fontSize: 12, color: "#5a5f78" }}>세금계산서 발행</p>
          </div>
          {/* 거래처 수 */}
          <div style={{ ...cardStyle, borderTop: "2px solid #f7a94f" }}>
            <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>거래처 수</p>
            <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{clients}개사</p>
            <p style={{ fontSize: 12, color: "#5a5f78" }}>활성 거래처</p>
          </div>
          {/* 월 평균 */}
          <div style={{ ...cardStyle, borderTop: "2px solid #f75f7a" }}>
            <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>월 평균 매출</p>
            <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{fmt(avg)}</p>
            <p style={{ fontSize: 12, color: "#5a5f78" }}>{fmtFull(avg)}</p>
          </div>
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
                <Line 
                  key={y} 
                  type="monotone" 
                  dataKey={`${y}년`} 
                  stroke={y === prevYear && activeYear !== "all" ? "rgba(255,255,255,0.3)" : COLORS[i % COLORS.length]} 
                  strokeWidth={y === prevYear && activeYear !== "all" ? 1.5 : 2.5}
                  strokeDasharray={y === prevYear && activeYear !== "all" ? "5 5" : undefined}
                  dot={{ r: y === prevYear && activeYear !== "all" ? 2 : 4 }} 
                  activeDot={{ r: 7 }} 
                />
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
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} 
                dataKey="value" nameKey="name" startAngle={90} endAngle={-270} >
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

        <p style={{ textAlign: "center", color: "#5a5f78", fontSize: 12, paddingBottom: 16 }}>
          데이터 기간: {data.length > 0 ? `${Math.min(...data.map(d => d.year))}년 ~ ${Math.max(...data.map(d => d.year))}년` : "-"}
          {" · "}총 {data.length.toLocaleString()}건
        </p>
      </div>
    </div>
  );
}