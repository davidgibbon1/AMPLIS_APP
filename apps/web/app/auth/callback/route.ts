import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/projects'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const type = requestUrl.searchParams.get('type')

  console.log('🔐 [CALLBACK] Auth callback received:', { 
    hasCode: !!code, 
    type, 
    next, 
    error 
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(
        errorDescription || error
      )}`
    )
  }

  // Exchange code for session
  if (code) {
    const supabase = createClient()
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    // Handle password recovery - redirect to reset-password page after exchanging code
    if (type === 'recovery') {
      console.log('🔐 [CALLBACK] Password recovery - code exchanged, redirecting to reset-password')
      if (exchangeError) {
        console.error('🔐 [CALLBACK] Recovery code exchange error:', exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/forgot-password?error=expired`
        )
      }
      return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`)
    }

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(
          exchangeError.message
        )}`
      )
    }

    if (data.user) {
      // Check if user exists in our database, create if not
      const existingUser = await prisma.user.findUnique({
        where: { id: data.user.id },
      })

      if (!existingUser) {
        // Create user profile for OAuth users
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || 
                  data.user.user_metadata?.name || 
                  null,
            avatarUrl: data.user.user_metadata?.avatar_url || null,
          },
        })

        // If this is a Google OAuth login, store the tokens
        if (data.session?.provider_token && data.user.app_metadata?.provider === 'google') {
          try {
            await prisma.googleAccount.create({
              data: {
                userId: data.user.id,
                email: data.user.email!,
                accessToken: data.session.provider_token,
                refreshToken: data.session.provider_refresh_token || null,
                tokenExpiresAt: data.session.expires_at 
                  ? new Date(data.session.expires_at * 1000) 
                  : null,
                scope: 'calendar drive',
              },
            })

            // Log OAuth connection
            await prisma.auditLog.create({
              data: {
                actorId: data.user.id,
                action: 'OAUTH_CONNECTED',
                entityType: 'user',
                entityId: data.user.id,
                metadata: { 
                  provider: 'google', 
                  email: data.user.email,
                },
              },
            })
          } catch (error) {
            // Log but don't fail if token storage fails
            console.error('Failed to store OAuth tokens:', error)
          }
        }

        // Log user creation
        await prisma.auditLog.create({
          data: {
            actorId: data.user.id,
            action: 'USER_CREATED',
            entityType: 'user',
            entityId: data.user.id,
            metadata: { 
              email: data.user.email, 
              provider: data.user.app_metadata?.provider,
            },
          },
        })
      } else {
        // Update Google tokens if this is an OAuth login
        if (data.session?.provider_token && data.user.app_metadata?.provider === 'google') {
          try {
            await prisma.googleAccount.upsert({
              where: {
                userId_email: {
                  userId: data.user.id,
                  email: data.user.email!,
                },
              },
              update: {
                accessToken: data.session.provider_token,
                refreshToken: data.session.provider_refresh_token || null,
                tokenExpiresAt: data.session.expires_at 
                  ? new Date(data.session.expires_at * 1000) 
                  : null,
              },
              create: {
                userId: data.user.id,
                email: data.user.email!,
                accessToken: data.session.provider_token,
                refreshToken: data.session.provider_refresh_token || null,
                tokenExpiresAt: data.session.expires_at 
                  ? new Date(data.session.expires_at * 1000) 
                  : null,
                scope: 'calendar drive',
              },
            })
          } catch (error) {
            console.error('Failed to update OAuth tokens:', error)
          }
        }
      }

      // Check if user has any org memberships
      const orgMemberships = await prisma.userOrgRole.findMany({
        where: { userId: data.user.id },
      })

      // If new user with no orgs, redirect to onboarding/org creation
      if (!existingUser && orgMemberships.length === 0) {
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
      }

      // Redirect to the next URL or projects page
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}

