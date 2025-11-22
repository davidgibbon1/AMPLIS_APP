'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { enrollMfaAction, verifyMfaEnrollmentAction } from '../../actions'

export default function MfaSetupPage() {
  const router = useRouter()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    async function enroll() {
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
      setEnrolling(false)
    }

    enroll()
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) return

    setError(null)
    setLoading(true)

    try {
      const result = await verifyMfaEnrollmentAction(factorId, code)

      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return
      }

      // MFA successfully enrolled
      router.push('/projects')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  function handleSkip() {
    router.push('/projects')
  }

  if (enrolling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Setting up MFA...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Set up Two-Factor Authentication</CardTitle>
          <CardDescription className="text-center">
            Protect your account with an extra layer of security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTitle>Recommended Security Step</AlertTitle>
            <AlertDescription>
              We strongly recommend enabling MFA to keep your account secure. You can skip this
              step and enable it later in your account settings.
            </AlertDescription>
          </Alert>

          {qrCode && (
            <>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-4">
                    1. Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
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
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    2. Enter the 6-digit code from your authenticator app
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleSkip}
                    disabled={loading}
                  >
                    Skip for now
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || code.length !== 6}>
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

