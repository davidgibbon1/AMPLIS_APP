import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Define protected route patterns
const protectedRoutes = [
  '/projects',
  '/people',
  '/billing',
  '/settings',
  '/ai-assistant',
  '/documents',
]

// Define auth routes that should redirect to app if already logged in
const authRoutes = ['/auth/login', '/auth/register']

// Routes that should ALWAYS be accessible (password reset, callback, etc.)
const publicAuthRoutes = [
  '/auth/reset-password',
  '/auth/forgot-password', 
  '/auth/callback',
  '/auth/mfa',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log('🛡️ [MIDDLEWARE] Request to:', pathname)

  // Always allow public auth routes (reset password, callback, etc.)
  const isPublicAuthRoute = publicAuthRoutes.some((route) => pathname.startsWith(route))
  if (isPublicAuthRoute) {
    console.log('🛡️ [MIDDLEWARE] ✓ Public auth route, allowing access:', pathname)
    // Still update the session for these routes
    const { response } = await updateSession(request)
    return response
  }

  // First, update the session (refresh tokens if needed)
  console.log('🛡️ [MIDDLEWARE] Updating session...')
  const { response, user } = await updateSession(request)
  console.log('🛡️ [MIDDLEWARE] ✓ Session updated')

  // Check if user is authenticated from Supabase
  const isAuthenticated = !!user
  console.log('🛡️ [MIDDLEWARE] Is authenticated:', isAuthenticated)
  if (user) {
    console.log('🛡️ [MIDDLEWARE] Authenticated user:', user.email)
  }

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  console.log('🛡️ [MIDDLEWARE] Is protected route:', isProtectedRoute)

  // Check if the current path is an auth route (login/register)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  console.log('🛡️ [MIDDLEWARE] Is auth route:', isAuthRoute)

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    console.log('🛡️ [MIDDLEWARE] 🔀 Redirecting to login (protected route, not authenticated)')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to app if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    console.log('🛡️ [MIDDLEWARE] 🔀 Redirecting to /projects (auth route, already authenticated)')
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    return NextResponse.redirect(url)
  }

  console.log('🛡️ [MIDDLEWARE] ✓ Allowing request to proceed')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

