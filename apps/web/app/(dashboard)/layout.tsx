'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    loadUser();
  }, []);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="h-14 flex items-center px-6 border-b font-bold text-lg">
          Amplis
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link 
            href="/projects" 
            className={`block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 font-medium ${
              pathname === '/projects' ? 'bg-slate-100' : ''
            }`}
          >
            Projects
          </Link>
          <Link 
            href="/people" 
            className={`block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 font-medium ${
              pathname === '/people' ? 'bg-slate-100' : ''
            }`}
          >
            People
          </Link>
          <Link 
            href="/billing" 
            className={`block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 font-medium ${
              pathname === '/billing' ? 'bg-slate-100' : ''
            }`}
          >
            Billing
          </Link>
          
          <div className="pt-4 pb-2 px-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Settings
            </div>
          </div>
          
          <Link 
            href="/settings/account" 
            className={`block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 ${
              pathname === '/settings/account' ? 'bg-slate-100 font-medium' : ''
            }`}
          >
            Account
          </Link>
          <Link 
            href="/settings/security" 
            className={`block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 ${
              pathname === '/settings/security' ? 'bg-slate-100 font-medium' : ''
            }`}
          >
            Security
          </Link>
          <Link 
            href="/admin" 
            className={`block px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 ${
              pathname === '/admin' ? 'bg-slate-100 font-medium' : ''
            }`}
          >
            Admin
          </Link>
        </nav>
        <div className="p-4 border-t">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : user ? (
            <div className="space-y-1">
              <div className="font-medium text-slate-900 truncate" title={user.user_metadata?.name || user.email}>
                {user.user_metadata?.name || 'User'}
              </div>
              <div className="text-xs text-slate-500 truncate" title={user.email}>
                {user.email}
              </div>
              <Link 
                href="/settings/account" 
                className="text-xs text-primary hover:underline"
              >
                View Profile
              </Link>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Not signed in</div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-14 border-b bg-white flex items-center px-8 justify-between">
           <h1 className="font-semibold text-slate-800">Dashboard</h1>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
    </>
  );
}

