'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { verifyMfaLoginAction } from '../../actions'

function MfaVerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const factorId = searchParams.get('factorId')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) {
      setError('Missing MFA factor ID')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const result = await verifyMfaLoginAction(factorId, code)

      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Successfully verified MFA
      const next = searchParams.get('next') || '/projects'
      router.push(next)
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!factorId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Invalid MFA setup. Please try logging in again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="code">
          Enter the 6-digit code from your authenticator app
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
          autoFocus
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
        {loading ? 'Verifying...' : 'Verify'}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Lost your device?{' '}
        <a href="/auth/mfa/recovery" className="text-primary hover:underline">
          Use recovery code
        </a>
      </p>
    </form>
  )
}

export default function MfaVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-center">
            Enter your authentication code to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <MfaVerifyForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

