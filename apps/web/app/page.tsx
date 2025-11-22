import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // User is logged in, redirect to app
    redirect('/projects')
  } else {
    // User is not logged in, redirect to login
    redirect('/auth/login')
  }
}
