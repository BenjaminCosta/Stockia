'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type TopLoadingBarProps = {
  className?: string
}

export function TopLoadingBar({ className }: TopLoadingBarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const routeKeyRef = useRef<string | null>(null)
  const finishTimerRef = useRef<number | null>(null)
  const trickleTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const clearTimers = () => {
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current)
      if (trickleTimerRef.current) window.clearInterval(trickleTimerRef.current)
    }

    const start = () => {
      clearTimers()
      setIsLoading(true)
      setProgress(18)
      trickleTimerRef.current = window.setInterval(() => {
        setProgress((current) => Math.min(current + Math.random() * 12, 86))
      }, 180)
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      const targetAttr = anchor.getAttribute('target')
      if (!href || href.startsWith('#') || targetAttr === '_blank') return

      const nextUrl = new URL(href, window.location.href)
      const currentUrl = new URL(window.location.href)
      const isInternal = nextUrl.origin === currentUrl.origin
      const isSameRoute = nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search

      if (isInternal && !isSameRoute) start()
    }

    window.addEventListener('click', handleClick, true)
    return () => {
      clearTimers()
      window.removeEventListener('click', handleClick, true)
    }
  }, [])

  useEffect(() => {
    const routeKey = `${pathname}?${searchParams.toString()}`

    if (routeKeyRef.current && routeKeyRef.current !== routeKey && !isLoading) {
      setIsLoading(true)
      setProgress(100)
      finishTimerRef.current = window.setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 300)
    }

    routeKeyRef.current = routeKey

    if (!isLoading) return

    if (trickleTimerRef.current) window.clearInterval(trickleTimerRef.current)
    setProgress(100)
    finishTimerRef.current = window.setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
    }, 260)
  }, [pathname, searchParams, isLoading])

  return (
    <div
      aria-hidden={!isLoading}
      aria-busy={isLoading}
      className={cn(
        'pointer-events-none fixed left-0 right-0 top-0 z-[200] h-[3px] overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'h-full origin-left rounded-r-full transition-all duration-300 ease-out',
          'bg-[#C8FF00]',
          isLoading ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          transform: `scaleX(${progress / 100})`,
          boxShadow: '0 0 10px 2px rgba(200,255,0,0.6)',
        }}
      />
    </div>
  )
}
