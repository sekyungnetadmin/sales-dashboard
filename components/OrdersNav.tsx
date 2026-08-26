"use client";
import { usePathname } from "next/navigation";

export default function OrdersNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/orders/inbox", label: "미처리 접수" },
    { href: "/orders/board", label: "출고 현황판" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        borderTop: "1px solid #eee",
        background: "#fff",
        zIndex: 10,
      }}
    >
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <a
            key={t.href}
            href={t.href}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "14px 0",
              fontSize: 13,
              fontWeight: active ? 700 : 400,
              color: active ? "#1a7a4c" : "#888",
              textDecoration: "none",
            }}
          >
            {t.label}
          </a>
        );
      })}
    </div>
  );
}
