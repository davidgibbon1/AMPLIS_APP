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
      
      // Provide user-friendly error messages
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return { success: false, error: 'An account with this email already exists. Try signing in instead.' }
      }
      if (error.message.includes('Password should be')) {
        return { success: false, error: 'Password does not meet security requirements. Please use at least 12 characters with uppercase, lowercase, and a number.' }
      }
      
      return { success: false, error: error.message || 'Unable to create account. Please try again.' }
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

    // Create a default organization for the user
    const orgName = validated.name ? `${validated.name}'s Organization` : 'My Organization'
    const orgSlug = validated.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    const org = await prisma.org.create({
      data: {
        name: orgName,
        slug: orgSlug,
      },
    })

    // Add user as owner of the org
    await prisma.userOrgRole.create({
      data: {
        userId: data.user.id,
        orgId: org.id,
        role: 'OWNER',
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

    // Log org creation
    await createAuditLog({
      actorId: data.user.id,
      action: 'ORG_CREATED',
      entityType: 'org',
      entityId: org.id,
      orgId: org.id,
      metadata: { name: orgName, slug: orgSlug },
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
  console.log('🔐 [LOGIN] Starting login action...')
  try {
    const rawData = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    }
    console.log('🔐 [LOGIN] Email:', rawData.email)

    console.log('🔐 [LOGIN] Validating schema...')
    const validated = loginSchema.parse(rawData)
    console.log('🔐 [LOGIN] ✓ Schema validated')

    console.log('🔐 [LOGIN] Creating Supabase client...')
    const supabase = createClient()
    console.log('🔐 [LOGIN] ✓ Supabase client created')

    console.log('🔐 [LOGIN] Calling signInWithPassword...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      console.error('🔐 [LOGIN] ❌ Supabase login error:', error)
      console.error('🔐 [LOGIN] Error details:', JSON.stringify(error, null, 2))
      
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'Please verify your email address before signing in.' }
      }
      if (error.message.includes('User not found')) {
        return { success: false, error: 'No account found with this email address.' }
      }
      
      return { success: false, error: error.message || 'Unable to sign in. Please try again.' }
    }

    console.log('🔐 [LOGIN] ✓ Supabase authentication successful')
    console.log('🔐 [LOGIN] User ID:', data.user?.id)
    console.log('🔐 [LOGIN] User email:', data.user?.email)
    console.log('🔐 [LOGIN] Session exists:', !!data.session)

    if (!data.user) {
      console.error('🔐 [LOGIN] ❌ No user returned from Supabase')
      return { success: false, error: 'Login failed - no user returned' }
    }

    // Check if MFA is required
    console.log('🔐 [LOGIN] Checking for MFA factors...')
    const { data: factors } = await supabase.auth.mfa.listFactors()
    console.log('🔐 [LOGIN] MFA factors:', JSON.stringify(factors, null, 2))
    
    if (factors && factors.totp && factors.totp.length > 0) {
      // MFA is enrolled, need verification
      const factor = factors.totp[0]
      console.log('🔐 [LOGIN] ⚠️ MFA required, factor ID:', factor.id)
      return { 
        success: true, 
        data: { 
          requiresMfa: true, 
          factorId: factor.id 
        } 
      }
    }

    console.log('🔐 [LOGIN] ✅ Login successful (no MFA required)')
    return { success: true, data: { requiresMfa: false } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('🔐 [LOGIN] ❌ Validation error:', error.errors)
      return { success: false, error: error.errors[0].message }
    }
    console.error('🔐 [LOGIN] ❌ Unexpected error:', error)
    console.error('🔐 [LOGIN] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
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

// Update user profile
export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const name = String(formData.get('name') ?? '').trim()
    
    if (!name) {
      return { success: false, error: 'Name is required' }
    }

    // Update in database
    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    })

    // Update in Supabase user metadata
    await supabase.auth.updateUser({
      data: { name },
    })

    await createAuditLog({
      actorId: user.id,
      action: 'PROFILE_UPDATED',
      entityType: 'user',
      entityId: user.id,
      metadata: { name },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Profile update error:', error)
    return { success: false, error: 'Failed to update profile. Please try again.' }
  }
}

// Update email
export async function updateEmailAction(newEmail: string): Promise<ActionResult> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!z.string().email().safeParse(newEmail).success) {
      return { success: false, error: 'Invalid email address' }
    }

    // Supabase will send a confirmation email to the new address
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (error) {
      console.error('Email update error:', error)
      if (error.message.includes('already registered')) {
        return { success: false, error: 'This email address is already in use.' }
      }
      return { success: false, error: error.message }
    }

    await createAuditLog({
      actorId: user.id,
      action: 'EMAIL_CHANGE_REQUESTED',
      entityType: 'user',
      entityId: user.id,
      metadata: { oldEmail: user.email, newEmail },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Email update error:', error)
    return { success: false, error: 'Failed to update email. Please try again.' }
  }
}

// Forgot Password - Send Reset Email
export async function forgotPasswordAction(email: string): Promise<ActionResult> {
  try {
    if (!z.string().email().safeParse(email).success) {
      return { success: false, error: 'Please enter a valid email address' }
    }

    const supabase = createClient()
    
    // Get the app URL - use env var or fallback to localhost
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${appUrl}/auth/reset-password`
    
    console.log('🔐 [FORGOT_PASSWORD] Sending reset email to:', email)
    console.log('🔐 [FORGOT_PASSWORD] Redirect URL:', redirectUrl)
    
    // Use the reset-password page directly - Supabase will add tokens to URL hash
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('🔐 [FORGOT_PASSWORD] Password reset error:', error)
      // Don't reveal if email exists or not for security
      return { success: true, data: undefined }
    }

    console.log('🔐 [FORGOT_PASSWORD] Reset email sent successfully')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Forgot password error:', error)
    return { success: false, error: 'Failed to send reset email. Please try again.' }
  }
}

// Reset Password - Update to New Password (after clicking email link)
export async function resetPasswordAction(newPassword: string): Promise<ActionResult> {
  try {
    const passwordValidation = z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .safeParse(newPassword)

    if (!passwordValidation.success) {
      return { success: false, error: passwordValidation.error.errors[0].message }
    }

    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'Failed to reset password. The link may have expired.' }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: 'Failed to reset password. Please try again.' }
  }
}

// Update password
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
})

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const rawData = {
      currentPassword: String(formData.get('currentPassword') ?? ''),
      newPassword: String(formData.get('newPassword') ?? ''),
    }

    const validated = passwordSchema.parse(rawData)

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validated.currentPassword,
    })

    if (signInError) {
      return { success: false, error: 'Current password is incorrect.' }
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
      password: validated.newPassword,
    })

    if (error) {
      console.error('Password update error:', error)
      return { success: false, error: 'Failed to update password. Please try again.' }
    }

    await createAuditLog({
      actorId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: user.id,
      metadata: {},
    })

    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Password update error:', error)
    return { success: false, error: 'Failed to update password. Please try again.' }
  }
}


