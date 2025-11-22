'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { enrollMfaAction, verifyMfaEnrollmentAction, unenrollMfaAction } from '@/app/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SecuritySettingsPage() {
  const [mfaFactors, setMfaFactors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadMfaFactors()
  }, [])

  async function loadMfaFactors() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      
      if (error) throw error
      
      setMfaFactors(data?.totp || [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to load MFA factors:', err)
      setLoading(false)
    }
  }

  async function handleEnrollMfa() {
    setError(null)
    setSuccess(null)
    setEnrolling(true)

    const result = await enrollMfaAction()

    if (!result.success) {
      setError(result.error)
      setEnrolling(false)
      return
    }

    setQrCode(result.data.qrCode)
    setSecret(result.data.secret)
    setFactorId(result.data.factorId)
  }

  async function handleVerifyEnrollment(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) return

    setError(null)
    setLoading(true)

    const result = await verifyMfaEnrollmentAction(factorId, verifyCode)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess('Two-factor authentication enabled successfully!')
    setQrCode(null)
    setSecret(null)
    setFactorId(null)
    setVerifyCode('')
    setEnrolling(false)
    
    // Reload factors
    await loadMfaFactors()
  }

  async function handleUnenroll(factorId: string) {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    const result = await unenrollMfaAction(factorId)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess('Two-factor authentication disabled successfully')
    await loadMfaFactors()
  }

  function cancelEnrollment() {
    setQrCode(null)
    setSecret(null)
    setFactorId(null)
    setVerifyCode('')
    setEnrolling(false)
    setError(null)
  }

  if (loading && !enrolling) {
    return (
      <div className="container max-w-4xl py-10">
        <p>Loading security settings...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security and authentication methods
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a code from your
            authenticator app when signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mfaFactors.length === 0 && !enrolling && (
            <>
              <Alert>
                <AlertTitle>2FA Not Enabled</AlertTitle>
                <AlertDescription>
                  Protect your account by enabling two-factor authentication. You'll need an
                  authenticator app like Google Authenticator, Authy, or 1Password.
                </AlertDescription>
              </Alert>
              <Button onClick={handleEnrollMfa}>
                Enable Two-Factor Authentication
              </Button>
            </>
          )}

          {enrolling && qrCode && (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Set up your authenticator app</AlertTitle>
                <AlertDescription>
                  Follow these steps to enable two-factor authentication
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-4">
                    1. Scan this QR code with your authenticator app
                  </p>
                  <div className="flex justify-center">
                    <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-2">
                    Or enter this code manually:
                  </p>
                  <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                    {secret}
                  </code>
                </div>

                <form onSubmit={handleVerifyEnrollment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verifyCode">
                      2. Enter the 6-digit code from your authenticator app
                    </Label>
                    <Input
                      id="verifyCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEnrollment}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading || verifyCode.length !== 6}>
                      {loading ? 'Verifying...' : 'Verify & Enable'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {mfaFactors.length > 0 && !enrolling && (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>2FA Enabled</AlertTitle>
                <AlertDescription>
                  Your account is protected with two-factor authentication. You'll need to enter
                  a code from your authenticator app when signing in.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {mfaFactors.map((factor) => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {factor.friendly_name || 'Authenticator App'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {factor.status === 'verified' ? 'Active' : 'Pending'}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnenroll(factor.id)}
                    >
                      Disable
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your connected OAuth providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <div>
                  <p className="font-medium">Google</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices where you're currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Session management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

