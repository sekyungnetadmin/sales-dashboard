"use client";
import { useEffect, useState } from "react";

type Order = {
  id: string;
  raw_text: string;
  received_at: string;
  status: string;
};

type Client = {
  id: string;
  company_name: string;
  contact_name: string | null;
};

export default function OrdersInboxPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<"세경네트" | "한두산업">("세경네트");
  const [shippingDate, setShippingDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadOrders() {
    setLoading(true);
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/clients?q=${encodeURIComponent(clientQuery)}`);
      const data = await res.json();
      setClientResults(data.clients || []);
    }, 200);
    return () => clearTimeout(t);
  }, [clientQuery]);

  function openOrder(id: string) {
    setOpenId(id);
    setSelectedClient(null);
    setClientQuery("");
    setCompany("세경네트");
    setShippingDate("");
  }

  async function complete(id: string) {
    if (!selectedClient) {
      alert("거래처를 선택해주세요.");
      return;
    }
    if (!shippingDate) {
      alert("출고일을 선택해주세요.");
      return;
    }
    setSaving(true);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: selectedClient.id,
        company,
        shipping_date: shippingDate,
      }),
    });
    setSaving(false);
    setOpenId(null);
    loadOrders();
  }


  

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>미처리 주문함</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        {loading ? "불러오는 중..." : `${orders.length}건 대기 중`}
      </p>

      {!loading && orders.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "#aaa", border: "1px dashed #ddd", borderRadius: 12 }}>
          처리할 주문이 없습니다.
        </div>
      )}

      {orders.map((o) => (
        <div
          key={o.id}
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            marginBottom: 12,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            onClick={() => (openId === o.id ? setOpenId(null) : openOrder(o.id))}
            style={{ padding: 16, cursor: "pointer" }}
          >
            <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>
              {new Date(o.received_at).toLocaleString("ko-KR")}
            </div>
            <div style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{o.raw_text}</div>
          </div>

          {openId === o.id && (
            <div style={{ padding: 16, borderTop: "1px solid #eee", background: "#fafafa" }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>거래처</label>
                {selectedClient ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#eef6ff",
                      borderRadius: 8,
                    }}
                  >
                    <span>{selectedClient.company_name}</span>
                    <button onClick={() => setSelectedClient(null)} style={{ border: "none", background: "none", color: "#888", cursor: "pointer" }}>
                      변경
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={clientQuery}
                      onChange={(e) => setClientQuery(e.target.value)}
                      placeholder="거래처명 검색"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }}
                    />
                    {clientResults.length > 0 && (
                      <div style={{ marginTop: 6, border: "1px solid #eee", borderRadius: 8, maxHeight: 200, overflowY: "auto" }}>
                        {clientResults.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedClient(c)}
                            style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                          >
                            {c.company_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>회사</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["세경네트", "한두산업"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCompany(c)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        border: company === c ? "2px solid #1a7a4c" : "1px solid #ddd",
                        background: company === c ? "#eafaf1" : "#fff",
                        fontWeight: company === c ? 700 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>출고예정일</label>
                <input
                  type="date"
                  value={shippingDate}
                  onChange={(e) => setShippingDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={() => complete(o.id)}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  background: "#1a7a4c",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {saving ? "처리 중..." : "처리완료"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}