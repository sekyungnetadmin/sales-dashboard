'use client'
import { useState, useEffect } from 'react'
import Script from 'next/script'

const GA_ID = 'G-M39XC8CXKQ'

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<boolean | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ga_consent')
    if (saved === 'true') {
      setConsent(true)
    } else {
      setConsent(false)
    }
  }, [])

  const handleAccept = () => {
    if (!checked) return
    localStorage.setItem('ga_consent', 'true')
    localStorage.setItem('ga_consent_date', new Date().toISOString())
    setConsent(true)
  }

  const handleDecline = () => {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666;font-size:14px;">접근이 거부되었습니다.</div>'
  }

  // 초기 로딩 중
  if (consent === null) {
    return null
  }

  // 동의 안 한 경우 - 모달만 표시
  if (consent === false) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            🔒 개인정보 수집 및 이용 동의
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            본 대시보드는 보안 및 서비스 개선을 위해 다음 정보를 수집합니다.
          </p>
          <div className="bg-gray-50 rounded p-3 text-xs space-y-1 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">수집 항목</span>
              <span>IP 주소, 접속 일시, 페이지</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">이용 목적</span>
              <span>접근 분석, 보안 감사</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">보유 기간</span>
              <span>14개월</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>위 내용에 동의합니다 (필수)</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleDecline}
              className="flex-1 border border-gray-300 rounded py-2 text-sm hover:bg-gray-50"
            >
              거부
            </button>
            <button
              onClick={handleAccept}
              disabled={!checked}
              className="flex-[2] bg-black text-white rounded py-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              동의하고 계속
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 동의한 경우 - GA 로드 + 사이트 표시
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