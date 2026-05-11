import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Inter, Sora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TopLoadingBar } from '@/components/ui/TopLoadingBar'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const sora = Sora({ 
  subsets: ["latin"],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Stockia - Conectamos distribuidoras con comercios',
  description: 'Plataforma B2B que conecta distribuidoras con comercios locales. Pedidos fáciles, entregas rápidas.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stockia',
  },
  icons: {
    icon: [
      {
        url: '/logo-S.png',
        type: 'image/png',
      },
    ],
    apple: '/logo-S.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#B42318',
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
    <html lang="es" className={`${inter.variable} ${sora.variable} bg-background`}>
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
