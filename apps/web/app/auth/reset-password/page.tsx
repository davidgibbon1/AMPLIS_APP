'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check for valid recovery session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Get the hash from URL (Supabase puts tokens there)
      const fullHash = window.location.hash
      console.log('🔐 [RESET] Full URL hash:', fullHash)
      
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      
      // Also check query params (some Supabase configs use these)
      const urlParams = new URLSearchParams(window.location.search)
      const codeFromUrl = urlParams.get('code')
      const typeFromUrl = urlParams.get('type')

      console.log('🔐 [RESET] Checking session...', { 
        type, 
        hasAccessToken: !!accessToken, 
        hasCode: !!codeFromUrl,
        typeFromUrl,
        fullUrl: window.location.href 
      })

      // If we have tokens in the URL, set the session
      if (accessToken && type === 'recovery') {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) {
          console.error('🔐 [RESET] Failed to set session:', error)
          setError('Invalid or expired reset link. Please request a new one.')
          setIsValidSession(false)
          return
        }

        console.log('🔐 [RESET] Session set successfully')
        setIsValidSession(true)
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      // Check if there's already an active session (for refresh scenarios)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('🔐 [RESET] Existing session found')
        setIsValidSession(true)
      } else {
        console.log('🔐 [RESET] No valid session')
        setError('Invalid or expired reset link. Please request a new one.')
        setIsValidSession(false)
      }
    }

    checkSession()
  }, [])

  // Password requirements
  const requirements = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ]

  const allRequirementsMet = requirements.every((r) => r.met)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!allRequirementsMet) {
      setError('Please meet all password requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Update password using Supabase client directly
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error('🔐 [RESET] Password update error:', error)
        setError(error.message || 'Failed to reset password. Please try again.')
        setLoading(false)
        return
      }

      // Sign out after password reset
      await supabase.auth.signOut()
      
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid/expired link
  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Link Expired</CardTitle>
            <CardDescription>
              {error || 'This password reset link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Password reset links expire after 24 hours for security reasons.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/auth/forgot-password" className="w-full">
              <Button className="w-full">
                Request new reset link
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Password reset successful!</CardTitle>
            <CardDescription>
              Your password has been updated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              You can now sign in with your new password.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting to sign in...
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Sign in now
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Set new password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Password requirements */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Password requirements:</p>
              <ul className="space-y-1">
                {requirements.map((req, index) => (
                  <li
                    key={index}
                    className={`text-sm flex items-center gap-2 ${
                      req.met ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {req.met ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300" />
                    )}
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !allRequirementsMet || !passwordsMatch}
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

