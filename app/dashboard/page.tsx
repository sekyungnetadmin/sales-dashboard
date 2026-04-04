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
  company: string;  // ← 추가
}

interface MonthModal {
  year: number;
  month: number;
  clients: { name: string; amount: number }[];
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
  const [monthModal, setMonthModal] = useState<MonthModal | null>(null);
  const [activeCompany, setActiveCompany] = useState<"all"|"세경네트"|"한두산업">("all");

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
     const company = (r["업체명"] || "세경네트").trim();
     rows.push({ name, date, year: date.getFullYear(), month: date.getMonth() + 1, amount, company });
    });
    setData(rows);
    setActiveYear("all");
    setActiveClient("all");
  }

  function handleChartClick(dotData: any) {
    const monthStr = dotData?.activeLabel as string;
    if (!monthStr) return;
    const month = parseInt(monthStr);
    const year = activeYear === "all" ? currentYear : activeYear as number;
    const clientFilter = activeClient === "all" ? companyFiltered : companyFiltered.filter(d => d.name === activeClient);
    const monthData = clientFilter.filter(d => d.year === year && d.month === month);
    const map: Record<string, number> = {};
    monthData.forEach(d => { map[d.name] = (map[d.name] || 0) + d.amount; });
    const clients = Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount }));
    setMonthModal({ year, month, clients });
  }

  const filtered = useMemo(() => data.filter(d => {
    const yOk = activeYear === "all" || d.year === activeYear;
    const cOk = activeClient === "all" || d.name === activeClient;
    const coOk = activeCompany === "all" || d.company === activeCompany;
    return yOk && cOk && coOk;
  }), [data, activeYear, activeClient, activeCompany]);

  const companyFiltered = useMemo(() =>
  activeCompany === "all" ? data : data.filter(d => d.company === activeCompany),
[data, activeCompany]);

  const years = useMemo(() => [...new Set(data.map(d => d.year))].sort(), [data]);
  const allClients = useMemo(() => [...new Set(data.map(d => d.name))].sort(), [data]);

  // KPI
  const total = filtered.reduce((s, d) => s + d.amount, 0);
  const count = filtered.length;
  const clients = new Set(filtered.map(d => d.name)).size;
  const months = new Set(filtered.map(d => `${d.year}-${d.month}`)).size || 1;
  const avg = total / months;

  // 전년 대비
  const currentYear = activeYear === "all" ? Math.max(...(years.length ? years : [0])) : activeYear as number;
  const prevYear = currentYear - 1;
  const currentTotal = companyFiltered.filter(d => d.year === currentYear && (activeClient === "all" || d.name === activeClient)).reduce((s, d) => s + d.amount, 0);
  const prevTotal = companyFiltered.filter(d => d.year === prevYear && (activeClient === "all" || d.name === activeClient)).reduce((s, d) => s + d.amount, 0);
  const growthRate = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100) : null;
  const growthColor = growthRate !== null ? (growthRate >= 0 ? "#38d9a9" : "#f75f7a") : "#5a5f78";
  const growthStr = growthRate !== null
    ? `${growthRate >= 0 ? "▲" : "▼"} 전년比 ${Math.abs(growthRate).toFixed(1)}%`
    : "전년 데이터 없음";

  // 월별 추이
  const activeYears = activeYear === "all" ? years : [prevYear, activeYear as number].filter(y => years.includes(y) || y === activeYear);

  const trendData = useMemo(() => {
    const chartYears = activeYear === "all" ? years : [prevYear, activeYear as number];
    return Array.from({ length: 12 }, (_, m) => {
      const obj: any = { month: `${m + 1}월` };
      chartYears.forEach(y => {
        const cf = activeClient === "all" ? companyFiltered  : companyFiltered.filter(d => d.name === activeClient);
        obj[`${y}년`] = cf.filter(d => d.year === y && d.month === m + 1).reduce((s, d) => s + d.amount, 0);
      });
      return obj;
    });
  }, [data, years, activeYear, activeClient, prevYear]);

  // 분기별
  const quarterYears = activeYear === "all" ? years : [activeYear as number];
  const quarterData = useMemo(() => {
    const qLabels = ["1분기", "2분기", "3분기", "4분기"];
    return qLabels.map((q, qi) => {
      const obj: any = { quarter: q };
      quarterYears.forEach(y => {
        const cf = activeClient === "all" ? companyFiltered  : companyFiltered.filter(d => d.name === activeClient);
        obj[`${y}년`] = cf.filter(d => d.year === y && d.month >= qi * 3 + 1 && d.month <= qi * 3 + 3).reduce((s, d) => s + d.amount, 0);
      });
      return obj;
    });
  }, [data, years, activeYear, activeClient]);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(d => { map[d.name] = (map[d.name] || 0) + d.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const yearData = useMemo(() => years.map(y => ({
    year: `${y}년`,
    매출: companyFiltered.filter(d => d.year === y && (activeClient === "all" || d.name === activeClient)).reduce((s, d) => s + d.amount, 0)
  })), [data, years, activeClient]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#4f8ef7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#8b90a8", fontSize: 14 }}>데이터 로딩 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    background: "#181c27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24
  };

  const modalTotal = monthModal?.clients.reduce((s, c) => s + c.amount, 0) || 1;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>

      {/* 월별 거래처 팝업 */}
      {monthModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setMonthModal(null)}>
          <div style={{ ...cardStyle, width: 420, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{monthModal.year}년 {monthModal.month}월 거래처별 매출</p>
              <button onClick={() => setMonthModal(null)}
                style={{ background: "transparent", border: "none", color: "#8b90a8", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            {monthModal.clients.length === 0 ? (
              <p style={{ color: "#5a5f78", fontSize: 13, textAlign: "center", padding: "20px 0" }}>데이터 없음</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {monthModal.clients.map((c, i) => (
                  <div key={c.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: "#e8eaf2", fontWeight: 500 }}>{i + 1}. {c.name}</span>
                      <span style={{ fontSize: 13, fontFamily: "monospace", color: COLORS[i % COLORS.length], fontWeight: 600 }}>{fmtFull(c.amount)}</span>
                    </div>
                    <div style={{ height: 4, background: "#1e2333", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(c.amount / modalTotal * 100).toFixed(1)}%`, background: COLORS[i % COLORS.length], borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#8b90a8", fontWeight: 600 }}>합계</span>
                  <span style={{ fontSize: 13, fontFamily: "monospace", color: "#e8eaf2", fontWeight: 600 }}>{fmtFull(modalTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 탑바 */}
      <div style={{ display: "flex", alignItems: "center", padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0f1117", position: "sticky", top: 0, zIndex: 100, gap: 16 }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 3, color: "#4f8ef7", fontWeight: 600 }}>SEKYUNG</span>
        <span style={{ color: "#5a5f78", fontSize: 14 }}>매출 대시보드</span>
      </div>

      {/* 필터 바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#181c27", flexWrap: "wrap" }}>
        {(["all", "세경네트", "한두산업"] as const).map(co => (
  <button
    key={co}
    onClick={() => setActiveCompany(co)}
    style={{
      padding: "7px 16px",
      borderRadius: 8,
      border: "1px solid",
      borderColor: activeCompany === co ? "#4f8ef7" : "rgba(255,255,255,0.12)",
      background: activeCompany === co ? "rgba(79,142,247,0.15)" : "transparent",
      color: activeCompany === co ? "#4f8ef7" : "#8b90a8",
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      fontFamily: "Noto Sans KR, sans-serif",
    }}
  >
    {co === "all" ? "전체 합산" : co}
  </button>
))}
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
        {(activeYear !== "all" || activeClient !== "all") && (
          <button onClick={() => { setActiveYear("all"); setActiveClient("all"); }}
            style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#5a5f78", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "Noto Sans KR, sans-serif" }}>
            초기화
          </button>
        )}
      </div>

      {/* 메인 */}
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400, margin: "0 auto" }}>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <div style={{ ...cardStyle, borderTop: "2px solid #4f8ef7" }}>
            <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>총 매출 (공급가액)</p>
            <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{fmt(total)}</p>
            <p style={{ fontSize: 12, color: "#5a5f78" }}>{fmtFull(total)}</p>
            <p style={{ fontSize: 12, color: growthColor, marginTop: 8, fontWeight: 600 }}>{growthStr}</p>
          </div>
          <div style={{ ...cardStyle, borderTop: "2px solid #38d9a9" }}>
            <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>거래 건수</p>
            <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{count.toLocaleString()}건</p>
            <p style={{ fontSize: 12, color: "#5a5f78" }}>세금계산서 발행</p>
          </div>
          <div style={{ ...cardStyle, borderTop: "2px solid #f7a94f" }}>
            <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>거래처 수</p>
            <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{clients}개사</p>
            <p style={{ fontSize: 12, color: "#5a5f78" }}>활성 거래처</p>
          </div>
          <div style={{ ...cardStyle, borderTop: "2px solid #f75f7a" }}>
            <p style={{ fontSize: 11, color: "#5a5f78", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>월 평균 매출</p>
            <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 600, color: "#e8eaf2", marginBottom: 4 }}>{fmt(avg)}</p>
            <p style={{ fontSize: 12, color: "#5a5f78" }}>{fmtFull(avg)}</p>
          </div>
        </div>

        {/* 월별 추이 */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>📈 월별 매출 추이</p>
            <p style={{ fontSize: 11, color: "#5a5f78" }}>월 클릭 → 거래처 상세</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} onClick={handleChartClick} style={{ cursor: "pointer" }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#5a5f78", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5a5f78", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8b90a8" }} />
              {activeYears.map((y, i) => (
                <Line key={y} type="monotone" dataKey={`${y}년`}
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

        {/* 분기별 매출 */}
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>📆 분기별 매출</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quarterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="quarter" tick={{ fill: "#8b90a8", fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5a5f78", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8b90a8" }} />
              {quarterYears.map((y, i) => (
                <Bar key={y} dataKey={`${y}년`} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 파이 + 연도별 바 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>🏢 거래처별 매출 비중</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value" nameKey="name" startAngle={90} endAngle={-270}>
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
