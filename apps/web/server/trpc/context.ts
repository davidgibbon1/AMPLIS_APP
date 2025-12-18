import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/client';
import type { Role } from '@prisma/client';

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const supabase = createClient();
  
  // Get authenticated user from Supabase
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return {
      user: null,
      org: null,
      headers: opts?.req.headers,
    };
  }

  // Get user's org memberships from database
  try {
    const userOrgRoles = await prisma.userOrgRole.findMany({
      where: { userId: user.id },
      include: {
        org: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Default to first org (in a real app, you'd have org selection logic)
    const currentOrgRole = userOrgRoles[0];
    
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


