'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
  name: z.string().min(1, 'Name is required'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const mfaVerifySchema = z.object({
  factorId: z.string(),
  code: z.string().length(6, 'Code must be 6 digits'),
})

// Helper to get IP and user agent
function getRequestInfo() {
  const headersList = headers()
  return {
    ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
    userAgent: headersList.get('user-agent') || null,
  }
}

// Helper to create audit log
async function createAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  orgId,
  metadata,
}: {
  actorId: string
  action: string
  entityType: string
  entityId: string
  orgId?: string
  metadata?: any
}) {
  const { ipAddress, userAgent } = getRequestInfo()
  
  await prisma.auditLog.create({
    data: {
      actorId,
      action: action as any,
      entityType,
      entityId,
      orgId,
      metadata,
      ipAddress,
      userAgent,
    },
  })
}

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

export async function registerAction(formData: FormData): Promise<ActionResult<{ userId: string }>> {
  try {
    const rawData = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      name: String(formData.get('name') ?? ''),
    }

    // Validate input
    const validated = registerSchema.parse(rawData)

    const supabase = createClient()

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          name: validated.name,
        },
      },
    })

    if (error) {
      console.error('Supabase signup error:', error)
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Sign up failed - no user returned' }
    }

    // Create user profile in our database
    await prisma.user.create({
      data: {
        id: data.user.id,
        email: validated.email,
        name: validated.name,
      },
    })

    // Log the user creation
    await createAuditLog({
      actorId: data.user.id,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: data.user.id,
      metadata: { email: validated.email, name: validated.name },
    })

    return { success: true, data: { userId: data.user.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Registration error:', error)
    return { success: false, error: 'An unexpected error occurred during registration' }
  }
}

export async function loginAction(formData: FormData): Promise<ActionResult<{ requiresMfa: boolean; factorId?: string }>> {
  try {
    const rawData = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    }

    const validated = loginSchema.parse(rawData)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      console.error('Supabase login error:', error)
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Login failed - no user returned' }
    }

    // Check if MFA is required
    const { data: factors } = await supabase.auth.mfa.listFactors()
    
    if (factors && factors.totp && factors.totp.length > 0) {
      // MFA is enrolled, need verification
      const factor = factors.totp[0]
      return { 
        success: true, 
        data: { 
          requiresMfa: true, 
          factorId: factor.id 
        } 
      }
    }

    return { success: true, data: { requiresMfa: false } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Login error:', error)
    return { success: false, error: 'An unexpected error occurred during login' }
  }
}

export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

// MFA Enrollment
export async function enrollMfaAction(): Promise<ActionResult<{ qrCode: string; factorId: string; secret: string }>> {
  try {
    const supabase = createClient()

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    })

    if (error || !data) {
      console.error('MFA enrollment error:', error)
      return { success: false, error: error?.message || 'Failed to enroll MFA' }
    }

    if (!data.totp) {
      return { success: false, error: 'Failed to generate TOTP secret' }
    }

    return {
      success: true,
      data: {
        qrCode: data.totp.qr_code,
        factorId: data.id,
        secret: data.totp.secret,
      },
    }
  } catch (error) {
    console.error('MFA enrollment error:', error)
    return { success: false, error: 'An unexpected error occurred during MFA enrollment' }
  }
}

// MFA Verification (for enrollment)
export async function verifyMfaEnrollmentAction(
  factorId: string,
  code: string
): Promise<ActionResult> {
  try {
    const validated = mfaVerifySchema.parse({ factorId, code })

    const supabase = createClient()

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase.auth.mfa.verify({
      factorId: validated.factorId,
      code: validated.code,
    })

    if (error) {
      console.error('MFA verification error:', error)
      return { success: false, error: 'Invalid code. Please try again.' }
    }

    // Log MFA enrollment
    await createAuditLog({
      actorId: userData.user.id,
      action: 'MFA_ENROLLED',
      entityType: 'user',
      entityId: userData.user.id,
      metadata: { factorId: validated.factorId },
    })

    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('MFA verification error:', error)
    return { success: false, error: 'An unexpected error occurred during MFA verification' }
  }
}

// MFA Challenge & Verify (for login)
export async function verifyMfaLoginAction(
  factorId: string,
  code: string
): Promise<ActionResult> {
  try {
    const validated = mfaVerifySchema.parse({ factorId, code })

    const supabase = createClient()

    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: validated.factorId,
      code: validated.code,
    })

    if (error) {
      console.error('MFA login verification error:', error)
      return { success: false, error: 'Invalid code. Please try again.' }
    }

    // Log MFA verification
    if (data.user) {
      await createAuditLog({
        actorId: data.user.id,
        action: 'MFA_VERIFIED',
        entityType: 'user',
        entityId: data.user.id,
        metadata: { factorId: validated.factorId },
      })
    }

    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('MFA login verification error:', error)
    return { success: false, error: 'An unexpected error occurred during MFA verification' }
  }
}

// Unenroll MFA
export async function unenrollMfaAction(factorId: string): Promise<ActionResult> {
  try {
    const supabase = createClient()

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    })

    if (error) {
      console.error('MFA unenroll error:', error)
      return { success: false, error: error.message }
    }

    // Log MFA disablement
    await createAuditLog({
      actorId: userData.user.id,
      action: 'MFA_DISABLED',
      entityType: 'user',
      entityId: userData.user.id,
      metadata: { factorId },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('MFA unenroll error:', error)
    return { success: false, error: 'An unexpected error occurred while disabling MFA' }
  }
}

// OAuth - Google Sign In
export async function signInWithGoogleAction() {
  const supabase = createClient()
  
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.readonly',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('Google OAuth error:', error)
    return { success: false, error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { success: false, error: 'Failed to initiate Google sign in' }
}

// Store OAuth tokens after successful OAuth login
export async function storeGoogleTokensAction(userId: string, email: string) {
  try {
    const supabase = createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || !session.provider_token) {
      return { success: false, error: 'No OAuth tokens available' }
    }

    // In production, encrypt these tokens before storing
    await prisma.googleAccount.upsert({
      where: {
        userId_email: {
          userId,
          email,
        },
      },
      update: {
        accessToken: session.provider_token,
        refreshToken: session.provider_refresh_token || null,
        tokenExpiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
        scope: session.user?.user_metadata?.iss || null,
      },
      create: {
        userId,
        email,
        accessToken: session.provider_token,
        refreshToken: session.provider_refresh_token || null,
        tokenExpiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
        scope: session.user?.user_metadata?.iss || null,
      },
    })

    await createAuditLog({
      actorId: userId,
      action: 'OAUTH_CONNECTED',
      entityType: 'user',
      entityId: userId,
      metadata: { provider: 'google', email },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error storing Google tokens:', error)
    return { success: false, error: 'Failed to store OAuth tokens' }
  }
}

