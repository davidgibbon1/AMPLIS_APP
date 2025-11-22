import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log('🔄 [SUPABASE_MW] Updating session...')
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value
          // console.log('🔄 [SUPABASE_MW] Getting cookie:', name, value ? '(exists)' : '(not found)')
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log('🔄 [SUPABASE_MW] Setting cookie:', name)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          console.log('🔄 [SUPABASE_MW] Removing cookie:', name)
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refreshing the auth token
  console.log('🔄 [SUPABASE_MW] Calling getUser to refresh token...')
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('🔄 [SUPABASE_MW] ❌ Error getting user:', error.message)
  } else if (user) {
    console.log('🔄 [SUPABASE_MW] ✓ User session valid:', user.email)
  } else {
    console.log('🔄 [SUPABASE_MW] ℹ️ No user session found')
  }

  return { response, user }
}

