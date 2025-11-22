import { prisma } from '@/lib/db/client'
import type { AuditAction } from '@prisma/client'
import { headers } from 'next/headers'

export interface AuditLogOptions {
  actorId: string
  action: AuditAction
  entityType: string
  entityId: string
  orgId?: string | null
  metadata?: Record<string, any>
}

/**
 * Create an audit log entry
 * 
 * Usage:
 * ```ts
 * await logAudit({
 *   actorId: user.id,
 *   action: 'PROJECT_CREATED',
 *   entityType: 'project',
 *   entityId: project.id,
 *   orgId: org.id,
 *   metadata: { name: project.name }
 * })
 * ```
 */
export async function logAudit(options: AuditLogOptions): Promise<void> {
  try {
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     null
    const userAgent = headersList.get('user-agent') || null

    await prisma.auditLog.create({
      data: {
        actorId: options.actorId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        orgId: options.orgId,
        metadata: options.metadata,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // Log but don't throw - audit logging should not break business logic
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Get audit logs for an entity
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  const { limit = 50, offset = 0 } = options || {}

  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      actor: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })
}

/**
 * Get audit logs for an organization
 */
export async function getOrgAuditLogs(
  orgId: string,
  options?: {
    limit?: number
    offset?: number
    action?: AuditAction
    actorId?: string
  }
) {
  const { limit = 50, offset = 0, action, actorId } = options || {}

  return prisma.auditLog.findMany({
    where: {
      orgId,
      ...(action && { action }),
      ...(actorId && { actorId }),
    },
    include: {
      actor: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })
}

/**
 * Get audit logs for a user's actions
 */
export async function getUserAuditLogs(
  actorId: string,
  options?: {
    limit?: number
    offset?: number
    orgId?: string
  }
) {
  const { limit = 50, offset = 0, orgId } = options || {}

  return prisma.auditLog.findMany({
    where: {
      actorId,
      ...(orgId && { orgId }),
    },
    include: {
      actor: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })
}

/**
 * Convenience functions for common audit actions
 */
export const auditLogger = {
  // User actions
  userCreated: (actorId: string, userId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: userId,
      metadata,
    }),

  userUpdated: (actorId: string, userId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: userId,
      metadata,
    }),

  // Organization actions
  orgCreated: (actorId: string, orgId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'ORG_CREATED',
      entityType: 'org',
      entityId: orgId,
      orgId,
      metadata,
    }),

  orgMemberAdded: (
    actorId: string,
    orgId: string,
    membershipId: string,
    metadata?: Record<string, any>
  ) =>
    logAudit({
      actorId,
      action: 'ORG_MEMBER_ADDED',
      entityType: 'membership',
      entityId: membershipId,
      orgId,
      metadata,
    }),

  orgMemberRoleChanged: (
    actorId: string,
    orgId: string,
    membershipId: string,
    metadata?: Record<string, any>
  ) =>
    logAudit({
      actorId,
      action: 'ORG_MEMBER_ROLE_CHANGED',
      entityType: 'membership',
      entityId: membershipId,
      orgId,
      metadata,
    }),

  // Project actions
  projectCreated: (actorId: string, orgId: string, projectId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: projectId,
      orgId,
      metadata,
    }),

  projectUpdated: (actorId: string, orgId: string, projectId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: projectId,
      orgId,
      metadata,
    }),

  projectDeleted: (actorId: string, orgId: string, projectId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'PROJECT_DELETED',
      entityType: 'project',
      entityId: projectId,
      orgId,
      metadata,
    }),

  // Deliverable actions
  deliverableCreated: (
    actorId: string,
    orgId: string,
    deliverableId: string,
    metadata?: Record<string, any>
  ) =>
    logAudit({
      actorId,
      action: 'DELIVERABLE_CREATED',
      entityType: 'deliverable',
      entityId: deliverableId,
      orgId,
      metadata,
    }),

  deliverableUpdated: (
    actorId: string,
    orgId: string,
    deliverableId: string,
    metadata?: Record<string, any>
  ) =>
    logAudit({
      actorId,
      action: 'DELIVERABLE_UPDATED',
      entityType: 'deliverable',
      entityId: deliverableId,
      orgId,
      metadata,
    }),

  // Invoice actions
  invoiceCreated: (actorId: string, orgId: string, invoiceId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'INVOICE_CREATED',
      entityType: 'invoice',
      entityId: invoiceId,
      orgId,
      metadata,
    }),

  invoiceSent: (actorId: string, orgId: string, invoiceId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'INVOICE_SENT',
      entityType: 'invoice',
      entityId: invoiceId,
      orgId,
      metadata,
    }),

  invoicePaid: (actorId: string, orgId: string, invoiceId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'INVOICE_PAID',
      entityType: 'invoice',
      entityId: invoiceId,
      orgId,
      metadata,
    }),

  // Auth/Security actions
  mfaEnrolled: (actorId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'MFA_ENROLLED',
      entityType: 'user',
      entityId: actorId,
      metadata,
    }),

  mfaVerified: (actorId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'MFA_VERIFIED',
      entityType: 'user',
      entityId: actorId,
      metadata,
    }),

  mfaDisabled: (actorId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'MFA_DISABLED',
      entityType: 'user',
      entityId: actorId,
      metadata,
    }),

  passwordChanged: (actorId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: actorId,
      metadata,
    }),

  oauthConnected: (actorId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'OAUTH_CONNECTED',
      entityType: 'user',
      entityId: actorId,
      metadata,
    }),

  oauthDisconnected: (actorId: string, metadata?: Record<string, any>) =>
    logAudit({
      actorId,
      action: 'OAUTH_DISCONNECTED',
      entityType: 'user',
      entityId: actorId,
      metadata,
    }),
}

