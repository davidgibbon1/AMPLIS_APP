'use client'

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, UserCheck, Users, Crown, Settings as SettingsIcon } from 'lucide-react';

export default function AdminPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: orgUsers = [], isLoading, refetch } = trpc.org.listOrgUsers.useQuery();
  const updateRole = trpc.org.updateUserRole.useMutation();

  async function handleRoleChange(userId: string, newRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER') {
    setError(null);
    setSuccess(null);

    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      setSuccess('User role updated successfully');
      refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  }

  const roleColors = {
    OWNER: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ADMIN: 'bg-red-100 text-red-800 border-red-200',
    MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
    MEMBER: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const roleIcons = {
    OWNER: Crown,
    ADMIN: Shield,
    MANAGER: UserCheck,
    MEMBER: Users,
  };

  const roleDescriptions = {
    OWNER: 'Full control over the organization, including billing and deletion',
    ADMIN: 'Can manage users, org levels, and all organization settings',
    MANAGER: 'Can manage projects, people, and allocations',
    MEMBER: 'Can view and contribute to assigned projects',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Management</h1>
        <p className="text-slate-600 mt-1">
          Manage user roles and permissions for your organization
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Role Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(roleDescriptions) as Array<keyof typeof roleDescriptions>).map((role) => {
          const Icon = roleIcons[role];
          return (
            <Card key={role} className={`border-2 ${roleColors[role]}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{role}</h3>
                    <p className="text-sm opacity-90">{roleDescriptions[role]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Users</CardTitle>
          <CardDescription>
            Manage roles and permissions for all users in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-600">Loading users...</p>
            </div>
          ) : orgUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Users Found</h3>
              <p className="text-slate-600">Invite users to your organization to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orgUsers.map((userRole: any) => {
                const Icon = roleIcons[userRole.role as keyof typeof roleIcons];
                return (
                  <div
                    key={userRole.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                        {userRole.user.avatarUrl ? (
                          <img 
                            src={userRole.user.avatarUrl} 
                            alt={userRole.user.name || userRole.user.email}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-slate-600">
                            {(userRole.user.name || userRole.user.email)[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {userRole.user.name || 'Unnamed User'}
                        </div>
                        <div className="text-sm text-slate-600">{userRole.user.email}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${roleColors[userRole.role as keyof typeof roleColors]}`}>
                          {userRole.role}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <select
                        value={userRole.role}
                        onChange={(e) => handleRoleChange(userRole.userId, e.target.value as any)}
                        className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="OWNER">Owner</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="MEMBER">Member</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <SettingsIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-slate-900 mb-2">Permission Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Only <strong>Owners</strong> can promote others to Owner status</li>
                <li>Only <strong>Admins</strong> and <strong>Owners</strong> can manage organization levels</li>
                <li><strong>Managers</strong> can create and edit people, projects, and allocations</li>
                <li><strong>Members</strong> can view projects and log time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







