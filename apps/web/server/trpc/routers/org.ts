import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import * as orgService from '@/server/domain/org/org.service';
import {
  createOrgLevelSchema,
  updateOrgLevelSchema,
  deleteOrgLevelSchema,
  createPersonSchema,
  updatePersonSchema,
  deletePersonSchema,
  updateUserRoleSchema,
} from '@/server/domain/org/org.schema';

export const orgRouter = router({
  // ========== OrgLevel Endpoints ==========
  
  listOrgLevels: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }
      return orgService.listOrgLevels(ctx.orgId);
    }),

  getOrgLevel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }
      return orgService.getOrgLevel(input.id, ctx.orgId);
    }),

  createOrgLevel: protectedProcedure
    .input(createOrgLevelSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }
      
      // Only admins and owners can create org levels
      if (!['ADMIN', 'OWNER'].includes(ctx.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create organization levels',
        });
      }

      return orgService.createOrgLevelForOrg(ctx.orgId, input, ctx.userId);
    }),

  updateOrgLevel: protectedProcedure
    .input(updateOrgLevelSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }

      // Only admins and owners can update org levels
      if (!['ADMIN', 'OWNER'].includes(ctx.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update organization levels',
        });
      }

      const { id, ...data } = input;
      return orgService.updateOrgLevelForOrg(id, ctx.orgId, data, ctx.userId);
    }),

  deleteOrgLevel: protectedProcedure
    .input(deleteOrgLevelSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }

      // Only admins and owners can delete org levels
      if (!['ADMIN', 'OWNER'].includes(ctx.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete organization levels',
        });
      }

      return orgService.deleteOrgLevelForOrg(input.id, ctx.orgId, ctx.userId);
    }),

  // ========== Person Endpoints ==========
  
  listPeople: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }
      return orgService.listPeople(ctx.orgId);
    }),

  getPerson: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }
      return orgService.getPerson(input.id, ctx.orgId);
    }),

  createPerson: protectedProcedure
    .input(createPersonSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }

      // Managers and above can create people
      if (!['ADMIN', 'OWNER', 'MANAGER'].includes(ctx.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only managers and above can create people',
        });
      }

      return orgService.createPersonForOrg(ctx.orgId, input, ctx.userId);
    }),

  updatePerson: protectedProcedure
    .input(updatePersonSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }

      // Managers and above can update people
      if (!['ADMIN', 'OWNER', 'MANAGER'].includes(ctx.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only managers and above can update people',
        });
      }

      const { id, ...data } = input;
      return orgService.updatePersonForOrg(id, ctx.orgId, data, ctx.userId);
    }),

  deletePerson: protectedProcedure
    .input(deletePersonSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }

      // Managers and above can delete people
      if (!['ADMIN', 'OWNER', 'MANAGER'].includes(ctx.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only managers and above can delete people',
        });
      }

      return orgService.deletePersonForOrg(input.id, ctx.orgId, ctx.userId);
    }),

  // ========== Hierarchy Endpoints ==========
  
  getOrgHierarchy: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }
      return orgService.getOrgHierarchy(ctx.orgId);
    }),

  // ========== Admin/Role Management Endpoints ==========
  
  listOrgUsers: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }

      // Only admins and owners can view all org users
      if (!['ADMIN', 'OWNER'].includes(ctx.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view organization users',
        });
      }

      return orgService.listOrgUsers(ctx.orgId);
    }),

  updateUserRole: protectedProcedure
    .input(updateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No organization selected',
        });
      }

      // Only admins and owners can update roles
      if (!['ADMIN', 'OWNER'].includes(ctx.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update user roles',
        });
      }

      // Only owners can create other owners
      if (input.role === 'OWNER' && ctx.role !== 'OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners can create other owners',
        });
      }

      return orgService.updateUserRole(input.userId, ctx.orgId, input.role, ctx.userId);
    }),
});







