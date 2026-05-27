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
      aria-label="Cargando StockIA"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f7f8fa_0%,#ffffff_52%,#f2f4f7_100%)] transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0B1A45]/[0.035] blur-3xl" />
      <div className="absolute left-[12%] top-[18%] h-32 w-32 rounded-full bg-[#C8FF00]/20 blur-3xl" />
      <div className="absolute bottom-[14%] right-[16%] h-40 w-40 rounded-full bg-[#0B1A45]/[0.05] blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 px-6">
        <div
          className="relative flex h-32 w-32 items-center justify-center"
          style={{
            animation: 'stockia-splash-logo 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <div
            className="absolute inset-0 rounded-[2.25rem] border border-[#0B1A45]/10 bg-white/90 shadow-[0_24px_70px_rgba(8,15,43,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
          />
          <div
            className="absolute inset-[-10px] rounded-[2.65rem] border border-[#C8FF00]/45 opacity-80"
            style={{ animation: 'stockia-splash-orbit 5s linear infinite' }}
          />
          <div
            className="absolute inset-3 overflow-hidden rounded-[1.8rem]"
            aria-hidden="true"
          >
            <span
              className="absolute inset-y-0 left-0 w-16 -skew-x-12 bg-linear-to-r from-transparent via-white/80 to-transparent"
              style={{ animation: 'stockia-splash-scan 1.7s ease-in-out 0.3s infinite' }}
            />
          </div>
          <div className="relative flex h-20 w-20 items-center justify-center drop-shadow-xl">
            <img
              src="/logo-iso.svg"
              alt="StockIA"
              className="h-20 w-20 object-contain"
            />
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-1.5"
          style={{ animation: 'stockia-splash-text 0.4s ease-out 0.25s both' }}
        >
          <span className="font-heading text-2xl font-bold tracking-tight text-foreground">StockIA</span>
          <span className="text-sm font-medium text-muted-foreground">Sincronizando tu operación</span>
        </div>

        <div
          className="h-1 w-56 overflow-hidden rounded-full bg-[#E5E7EB]"
          style={{ animation: 'stockia-splash-text 0.4s ease-out 0.35s both' }}
        >
          <div
            className="relative h-full rounded-full bg-[#0B1A45]"
            style={{ animation: 'stockia-splash-bar 1.2s cubic-bezier(0.4,0,0.2,1) 0.4s both' }}
          >
            <span
              className="absolute right-0 top-0 h-full w-10 rounded-full bg-[#C8FF00]/80"
              style={{ filter: 'blur(2px)', animation: 'stockia-bar-shine 1.2s ease-in-out 0.4s infinite' }}
            />
          </div>
        </div>

        <div className="flex gap-1.5 text-[#0B1A45]" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot [animation-delay:-160ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot [animation-delay:-80ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot" />
        </div>
      </div>
    </div>
  )
}
