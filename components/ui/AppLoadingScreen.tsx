'use client'

import { useEffect, useState } from 'react'

export function AppLoadingScreen() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    setMounted(true)
    const fadeTimer = setTimeout(() => setFading(true), 1400)
    const hideTimer = setTimeout(() => setVisible(false), 1850)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!mounted || !visible) return null

  return (
    <div
      aria-live="polite"
      aria-label="Cargando StockIA"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f7f8fa_0%,#ffffff_52%,#f2f4f7_100%)] transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0B1A45]/[0.03] blur-3xl" />
      <div className="absolute left-[14%] top-[18%] h-28 w-28 rounded-full bg-[#C8FF00]/14 blur-3xl" />

      <div className="relative flex w-full max-w-72 flex-col items-center px-6 text-center">
        <div
          className="relative mb-7 flex h-38 w-38 items-center justify-center sm:h-42 sm:w-42"
          style={{ animation: 'stockia-splash-logo 0.55s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          <span className="absolute inset-8 rounded-full bg-[#C8FF00]/18 blur-2xl" aria-hidden="true" />
          <img
            src="/assets/logo-3d.png"
            alt=""
            className="relative h-full w-full object-contain drop-shadow-[0_22px_34px_rgba(11,26,69,0.14)] animate-stockia-session-float"
            aria-hidden="true"
          />
        </div>

        <div
          className="flex flex-col items-center gap-1.5"
          style={{ animation: 'stockia-splash-text 0.4s ease-out 0.25s both' }}
        >
          <span className="font-heading text-xl font-bold tracking-tight text-[#0B1A45] sm:text-2xl">StockIA</span>
          <span className="text-sm font-medium text-muted-foreground">Sincronizando tu operación</span>
        </div>

        <div
          className="mt-5 flex h-5 items-center justify-center gap-2"
          style={{ animation: 'stockia-splash-text 0.4s ease-out 0.35s both' }}
          aria-hidden="true"
        >
          <span className="h-2 w-8 rounded-full bg-[#0B1A45] animate-stockia-session-bar [animation-delay:-220ms]" />
          <span className="h-2 w-8 rounded-full bg-[#C8FF00] animate-stockia-session-bar [animation-delay:-110ms]" />
          <span className="h-2 w-8 rounded-full bg-[#0B1A45] animate-stockia-session-bar" />
        </div>
      </div>
    </div>
  )
}
