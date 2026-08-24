"use client";
import { useEffect } from "react";

export default function TestSharePage() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  const params = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>공유받은 데이터 확인</h2>
      <p><b>title:</b> {params.get("title") || "(없음)"}</p>
      <p><b>text:</b></p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f4f4f4", padding: 10 }}>
        {params.get("text") || "(없음)"}
      </pre>
      <p><b>url:</b> {params.get("url") || "(없음)"}</p>
    </div>
  );
}