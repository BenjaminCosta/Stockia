import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TopLoadingBar } from '@/components/ui/TopLoadingBar'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const sora = Sora({
  subsets: ["latin"],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StockIA - Conectamos distribuidoras con comercios',
  description: 'Plataforma B2B que conecta distribuidoras con comercios locales. Pedidos fáciles, entregas rápidas.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StockIA',
  },
  icons: {
    icon: [
      {
        url: '/logo-iso.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/logo-iso.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B1A45',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${sora.variable} bg-background`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <TopLoadingBar />
        </Suspense>
        <AppLoadingScreen />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
