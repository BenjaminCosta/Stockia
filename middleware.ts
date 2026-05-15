import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_ROUTES = ['/login', '/registro']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('stockia-session')?.value
  const role    = request.cookies.get('stockia-role')?.value

  const isAuthRoute    = AUTH_ROUTES.some(p => pathname.startsWith(p))
  const isAdminRoute   = pathname.startsWith('/admin')
  const isComercio     = pathname.startsWith('/comercio')
  const isDistrib      = pathname.startsWith('/distribuidora')
  const isProtected    = isAdminRoute || isComercio || isDistrib

  // No session → send to login
  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin route but role isn't admin → send to their correct dashboard
  if (isAdminRoute && session && role !== 'admin') {
    const dest = role === 'distribuidora' ? '/distribuidora' : '/comercio'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Non-admin routes but logged in as admin → send to admin
  if ((isComercio || isDistrib) && session && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Authenticated user hitting login/registro → their dashboard
  if (isAuthRoute && session) {
    const dest = role === 'admin' ? '/admin' : role === 'distribuidora' ? '/distribuidora' : '/comercio'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public files (images, SVGs, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
