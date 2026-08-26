"use client";
import { useEffect, useState } from "react";

export default function OrdersSummaryBar() {
  const [pending, setPending] = useState<number | null>(null);
  const [todayShipping, setTodayShipping] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/orders/summary", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setPending(data.pending ?? 0);
        setTodayShipping(data.todayShipping ?? 0);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          flex: 1,
          background: "#fff5f5",
          border: "1px solid #ffd5d5",
          borderRadius: 10,
          padding: "12px 14px",
        }}
      >
        <div style={{ fontSize: 12, color: "#c0392b", fontWeight: 700, marginBottom: 2 }}>
          미처리 건수
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>
          {pending === null ? "-" : pending}건
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background: "#f0fbf5",
          border: "1px solid #c8ecd8",
          borderRadius: 10,
          padding: "12px 14px",
        }}
      >
        <div style={{ fontSize: 12, color: "#1a7a4c", fontWeight: 700, marginBottom: 2 }}>
          오늘 출고건수
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>
          {todayShipping === null ? "-" : todayShipping}건
        </div>
      </div>
    </div>
  );
}
