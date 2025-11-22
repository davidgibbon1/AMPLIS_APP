'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { updateProfileAction, updateEmailAction, updatePasswordAction, logoutAction } from '@/app/auth/actions'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Profile form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [updatingEmail, setUpdatingEmail] = useState(false)
  
  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      if (user) {
        setUser(user)
        setName(user.user_metadata?.name || '')
        setEmail(user.email || '')
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Failed to load user:', err)
      setLoading(false)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUpdatingProfile(true)

    const formData = new FormData()
    formData.append('name', name)

    const result = await updateProfileAction(formData)

    if (!result.success) {
      setError(result.error)
      setUpdatingProfile(false)
      return
    }

    setSuccess('Profile updated successfully!')
    setUpdatingProfile(false)
    await loadUser()
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUpdatingEmail(true)

    const result = await updateEmailAction(email)

    if (!result.success) {
      setError(result.error)
      setUpdatingEmail(false)
      return
    }

    setSuccess('Confirmation email sent! Please check your inbox to verify your new email address.')
    setUpdatingEmail(false)
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setUpdatingPassword(true)

    const formData = new FormData()
    formData.append('currentPassword', currentPassword)
    formData.append('newPassword', newPassword)

    const result = await updatePasswordAction(formData)

    if (!result.success) {
      setError(result.error)
      setUpdatingPassword(false)
      return
    }

    setSuccess('Password updated successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPasswordForm(false)
    setUpdatingPassword(false)
  }

  async function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
      await logoutAction()
      router.push('/auth/login')
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-10">
        <p>Loading account settings...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-10">
        <Alert variant="destructive">
          <AlertDescription>Please sign in to view your account settings.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and account preferences
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

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updatingProfile}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={user.id}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">
                Your unique user identifier (read-only)
              </p>
            </div>

            <Button type="submit" disabled={updatingProfile}>
              {updatingProfile ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email Address */}
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Change your account email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={updatingEmail}
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll send a confirmation link to your new email address
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={updatingEmail || email === user.email}
            >
              {updatingEmail ? 'Updating...' : 'Update Email'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordForm ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </Button>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={updatingPassword}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updatingPassword}
                  required
                  placeholder="Min. 12 characters"
                />
                <p className="text-xs text-muted-foreground">
                  Must contain at least 12 characters, including uppercase, lowercase, and a digit
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={updatingPassword}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  disabled={updatingPassword}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatingPassword}>
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Sign out or manage your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

