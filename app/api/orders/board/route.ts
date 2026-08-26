"use client";
import { useEffect, useState } from "react";
import OrdersNav from "@/components/OrdersNav";
import OrdersSummaryBar from "@/components/OrdersSummaryBar";

type Order = {
  id: string;
  raw_text: string;
  status: string;
  shipping_date: string;
  company: string;
  clients: { company_name: string } | null;
};

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function OrdersBoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/board", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      });
  }, []);

  const today = toDateStr(new Date());
  const tomorrow = toDateStr(new Date(Date.now() + 86400000));

  const groups: { label: string; orders: Order[] }[] = [
    { label: "오늘 출고", orders: orders.filter((o) => o.shipping_date === today) },
    { label: "내일 출고", orders: orders.filter((o) => o.shipping_date === tomorrow) },
    { label: "그 이후", orders: orders.filter((o) => o.shipping_date > tomorrow) },
    { label: "지연 (출고일 지남)", orders: orders.filter((o) => o.shipping_date < today) },
  ];

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "24px 16px 80px",
        fontFamily: "'Noto Sans KR', sans-serif",
        colorScheme: "light",
        background: "#fafafa",
        minHeight: "100vh",
        color: "#222",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "#222" }}>
        출고 현황판
      </h1>

      <OrdersSummaryBar />

      {loading && <p style={{ color: "#888" }}>불러오는 중...</p>}

      {!loading &&
        groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: g.label === "지연 (출고일 지남)" ? "#c0392b" : "#1a7a4c",
                }}
              >
                {g.label}
              </h2>
              <span style={{ fontSize: 12, color: "#999" }}>{g.orders.length}건</span>
            </div>

            {g.orders.length === 0 ? (
              <div style={{ fontSize: 13, color: "#bbb", padding: "8px 0" }}>없음</div>
            ) : (
              g.orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    border: "1px solid #e5e5e5",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 8,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>
                      {o.clients?.company_name || "(거래처 미확인)"}
                    </span>
                    <span style={{ fontSize: 11, color: "#888" }}>{o.company}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#444", whiteSpace: "pre-wrap", marginBottom: 6 }}>
                    {o.raw_text}
                  </div>
                  <div style={{ fontSize: 11, color: "#999" }}>
                    출고예정: {o.shipping_date} · 상태: {o.status}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}

      <OrdersNav />
    </div>
  );
}
