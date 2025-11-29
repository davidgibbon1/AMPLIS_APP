import { z } from 'zod';

// OrgLevel schemas
export const createOrgLevelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  order: z.number().int().default(0),
});

export const updateOrgLevelSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export const deleteOrgLevelSchema = z.object({
  id: z.string(),
});

// Person schemas
export const createPersonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email().optional(),
  orgLevelId: z.string().optional(),
  managerId: z.string().optional(),
  defaultRate: z.number().nonnegative().default(0),
  billRate: z.number().nonnegative().default(0),
  userId: z.string().optional(),
});

export const updatePersonSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  orgLevelId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  defaultRate: z.number().nonnegative().optional(),
  billRate: z.number().nonnegative().optional(),
});

export const deletePersonSchema = z.object({
  id: z.string(),
});

// Admin management schemas
export const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER']),
});

// Types
export type CreateOrgLevel = z.infer<typeof createOrgLevelSchema>;
export type UpdateOrgLevel = z.infer<typeof updateOrgLevelSchema>;
export type CreatePerson = z.infer<typeof createPersonSchema>;
export type UpdatePerson = z.infer<typeof updatePersonSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;







