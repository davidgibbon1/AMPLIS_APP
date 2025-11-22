import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/client';
import type { Role } from '@prisma/client';

export async function createContext(opts?: FetchCreateContextFnOptions) {
  console.log('🔧 [CONTEXT] Creating tRPC context...')
  const supabase = createClient();
  
  // Get authenticated user from Supabase
  console.log('🔧 [CONTEXT] Fetching user from Supabase...')
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('🔧 [CONTEXT] ❌ Error fetching user:', error)
    return {
      user: null,
      org: null,
      headers: opts?.req.headers,
    };
  }
  
  if (!user) {
    console.log('🔧 [CONTEXT] ℹ️ No authenticated user')
    return {
      user: null,
      org: null,
      headers: opts?.req.headers,
    };
  }

  console.log('🔧 [CONTEXT] ✓ User authenticated:', user.id, user.email)

  // Get user's org memberships from database
  console.log('🔧 [CONTEXT] Querying user org memberships from database...')
  try {
    const userOrgRoles = await prisma.userOrgRole.findMany({
      where: { userId: user.id },
      include: {
        org: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log('🔧 [CONTEXT] ✓ Found', userOrgRoles.length, 'org memberships')
    userOrgRoles.forEach((uor, i) => {
      console.log(`🔧 [CONTEXT]   ${i + 1}. Org: ${uor.org.name} (${uor.orgId}), Role: ${uor.role}`)
    })

    // Default to first org (in a real app, you'd have org selection logic)
    const currentOrgRole = userOrgRoles[0];
    
    if (currentOrgRole) {
      console.log('🔧 [CONTEXT] ✓ Using org:', currentOrgRole.org.name)
    } else {
      console.log('🔧 [CONTEXT] ⚠️ User has no org memberships')
    }
    
    return {
      user: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
      },
      org: currentOrgRole ? {
        id: currentOrgRole.orgId,
        name: currentOrgRole.org.name,
        role: currentOrgRole.role,
      } : null,
      allOrgs: userOrgRoles.map(uor => ({
        id: uor.orgId,
        name: uor.org.name,
        role: uor.role,
      })),
      headers: opts?.req.headers,
    };
  } catch (dbError) {
    console.error('🔧 [CONTEXT] ❌ Database query error:', dbError)
    console.error('🔧 [CONTEXT] Error details:', dbError instanceof Error ? dbError.message : 'Unknown error')
    console.error('🔧 [CONTEXT] Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace')
    
    // Return context with user but no org on DB error
    return {
      user: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
      },
      org: null,
      allOrgs: [],
      headers: opts?.req.headers,
    };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// Helper to require authentication
export function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new Error('UNAUTHORIZED');
  }
  return ctx.user;
}

// Helper to require org context
export function requireOrg(ctx: Context) {
  if (!ctx.org) {
    throw new Error('NO_ORG_CONTEXT');
  }
  return ctx.org;
}

// Helper to check role permissions
export function requireRole(ctx: Context, allowedRoles: Role[]) {
  const org = requireOrg(ctx);
  if (!allowedRoles.includes(org.role)) {
    throw new Error('FORBIDDEN');
  }
  return org;
}


