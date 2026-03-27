"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError(true);
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Noto Sans KR, sans-serif"
    }}>
      <div style={{
        background: "#181c27", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20, padding: "48px 40px", width: 360, textAlign: "center"
      }}>
        <p style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 4, color: "#4f8ef7", fontWeight: 600, marginBottom: 12 }}>
          SEKYUNG
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#e8eaf2", marginBottom: 6 }}>매출 대시보드</p>
        <p style={{ fontSize: 13, color: "#5a5f78", marginBottom: 36 }}>비밀번호를 입력하세요</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            placeholder="비밀번호"
            autoFocus
            style={{
              width: "100%", padding: "12px 16px",
              background: "#1e2333", border: `1px solid ${error ? "#f75f7a" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10, color: "#e8eaf2", fontSize: 15,
              fontFamily: "Noto Sans KR, sans-serif", outline: "none",
              marginBottom: error ? 8 : 20, boxSizing: "border-box",
              transition: "border-color 0.2s"
            }}
          />
          {error && (
            <p style={{ color: "#f75f7a", fontSize: 13, marginBottom: 16 }}>비밀번호가 올바르지 않아요</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%", padding: "13px",
              background: loading || !password ? "#2a3050" : "#4f8ef7",
              border: "none", borderRadius: 10,
              color: loading || !password ? "#5a5f78" : "#fff",
              fontSize: 15, fontWeight: 600, cursor: loading || !password ? "default" : "pointer",
              fontFamily: "Noto Sans KR, sans-serif", transition: "all 0.2s"
            }}
          >
            {loading ? "확인 중..." : "입장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
