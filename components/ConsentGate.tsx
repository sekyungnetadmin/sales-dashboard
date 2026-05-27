'use client'
import { useState } from 'react'
import Script from 'next/script'

const GA_ID = 'G-M39XC8CXKQ'

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState(false)
  const [checked, setChecked] = useState(false)

  const handleAccept = () => {
    if (!checked) return
    setConsent(true)
  }

  const handleDecline = () => {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#888;font-size:14px;background:#0a0a0a;">접근이 거부되었습니다.</div>'
  }

  if (!consent) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}>
        <div style={{
          background: '#1a1a2e',
          border: '1px solid #2d2d44',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          color: '#e5e5e5',
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🔒 개인정보 수집 및 이용 동의
          </h3>
          
          <p style={{
            fontSize: '14px',
            color: '#b8b8c8',
            marginBottom: '16px',
            lineHeight: 1.6,
          }}>
            본 대시보드는 보안 및 서비스 개선을 위해 다음 정보를 수집합니다.
          </p>
          
          <div style={{
            background: '#0f0f1e',
            border: '1px solid #2d2d44',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '18px',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#8a8a9e' }}>수집 항목</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>IP 주소, 접속 일시, 페이지</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#8a8a9e' }}>이용 목적</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>접근 분석, 보안 감사</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#8a8a9e' }}>보유 기간</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>14개월</span>
            </div>
          </div>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            background: '#1e3a5f',
            color: '#a8d4ff',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            cursor: 'pointer',
            fontWeight: 500,
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>위 내용에 동의합니다 (필수)</span>
          </label>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDecline}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #3d3d54',
                color: '#b8b8c8',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              거부
            </button>
            <button
              onClick={handleAccept}
              disabled={!checked}
              style={{
                flex: 2,
                background: checked ? '#4f7cff' : '#2d3142',
                color: checked ? '#ffffff' : '#6a6a7e',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: checked ? 'pointer' : 'not-allowed',
              }}
            >
              동의하고 계속
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            allow_google_signals: false
          });
        `}
      </Script>
      {children}
    </>
  )
}