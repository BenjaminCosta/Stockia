'use client'

import { useEffect, useState } from 'react'

export function AppLoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Start fade-out after 1.4s, fully unmount after 1.8s
    const fadeTimer = setTimeout(() => setFading(true), 1400)
    const hideTimer = setTimeout(() => setVisible(false), 1850)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-live="polite"
      aria-label="Cargando Stockia"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#F7F7F8] transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#111827 1px, transparent 1px), linear-gradient(to right, #111827 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo mark */}
        <div
          className="relative"
          style={{
            animation: 'stockia-splash-logo 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <div className="relative h-24 w-24 flex items-center justify-center drop-shadow-xl">
            <img
              src="/logo-S.png"
              alt="Stockia"
              className="h-24 w-24 object-contain"
            />
          </div>
        </div>

        {/* Wordmark */}
        <div
          className="flex flex-col items-center gap-1"
          style={{ animation: 'stockia-splash-text 0.4s ease-out 0.25s both' }}
        >
          <span className="font-heading font-bold text-2xl text-[#111827] tracking-tight">Stockia</span>
          <span className="text-sm text-[#6B7280] font-medium">Preparando tu stock&hellip;</span>
        </div>

        {/* Progress bar */}
        <div
          className="w-48 h-0.75 rounded-full bg-[#E5E7EB] overflow-hidden"
          style={{ animation: 'stockia-splash-text 0.4s ease-out 0.35s both' }}
        >
          <div
            className="h-full rounded-full bg-[#B42318] relative"
            style={{ animation: 'stockia-splash-bar 1.2s cubic-bezier(0.4,0,0.2,1) 0.4s both' }}
          >
            {/* Shine dot */}
            <span
              className="absolute top-0 right-0 h-full w-6 rounded-full bg-white/60"
              style={{ filter: 'blur(2px)', animation: 'stockia-bar-shine 1.2s ease-in-out 0.4s infinite' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
