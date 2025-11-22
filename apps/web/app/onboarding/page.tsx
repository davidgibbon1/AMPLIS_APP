'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const orgName = String(formData.get('orgName') ?? '')
    const orgSlug = String(formData.get('orgSlug') ?? '')

    try {
      // TODO: Create tRPC endpoint for org creation
      // const result = await trpc.org.create.mutate({ name: orgName, slug: orgSlug })
      
      // Placeholder - redirect to projects
      router.push('/projects')
    } catch (err) {
      setError('Failed to create organization')
      setLoading(false)
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Amplis!
          </CardTitle>
          <CardDescription className="text-center">
            Let's set up your first organization to get started
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
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                name="orgName"
                type="text"
                required
                placeholder="Acme Consulting"
                disabled={loading}
                onChange={(e) => {
                  const slugInput = document.getElementById('orgSlug') as HTMLInputElement
                  if (slugInput && !slugInput.dataset.userModified) {
                    slugInput.value = generateSlug(e.target.value)
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                The name of your company or team
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgSlug">Organization Slug</Label>
              <Input
                id="orgSlug"
                name="orgSlug"
                type="text"
                required
                placeholder="acme-consulting"
                disabled={loading}
                pattern="[a-z0-9-]+"
                onChange={(e) => {
                  e.target.dataset.userModified = 'true'
                }}
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                What's an organization?
              </h4>
              <p className="text-xs text-blue-800">
                Organizations let you manage projects, team members, and resources. You can
                create multiple organizations or be part of several teams.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating organization...' : 'Create Organization'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

