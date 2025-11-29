import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as service from '@/server/domain/gantt/gantt.service';
import {
  assignResourceSchema,
  updateTaskResourceSchema,
  removeResourceSchema,
  createCustomResourceSchema,
  updateCustomResourceSchema
} from '@/server/domain/gantt/gantt.schema';

export const resourceRouter = router({
  // Assign a resource to a task
  assign: protectedProcedure
    .input(assignResourceSchema)
    .mutation(async ({ ctx, input }) => {
      return service.assignResource(ctx.user.id, input);
    }),

  // Update resource allocation
  update: protectedProcedure
    .input(updateTaskResourceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return service.updateTaskResource(id, data);
    }),

  // Remove a resource from a task
  remove: protectedProcedure
    .input(removeResourceSchema)
    .mutation(async ({ ctx, input }) => {
      return service.removeResource(ctx.user.id, input.id);
    }),

  // Get resource capacity for a date range
  capacity: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ ctx, input }) => {
      return service.getResourceCapacity(
        ctx.org.id,
        input.startDate,
        input.endDate
      );
    }),

  // Get utilization for a specific person
  utilization: protectedProcedure
    .input(z.object({
      personId: z.string(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ ctx, input }) => {
      return service.getPersonUtilization(
        input.personId,
        input.startDate,
        input.endDate
      );
    }),

  // Create a custom resource
  createCustom: protectedProcedure
    .input(createCustomResourceSchema)
    .mutation(async ({ ctx, input }) => {
      return service.createCustomResource(ctx.org.id, input);
    }),

  // Update a custom resource
  updateCustom: protectedProcedure
    .input(updateCustomResourceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return service.updateCustomResource(id, data);
    }),

  // Delete a custom resource
  deleteCustom: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.deleteCustomResource(input.id);
    }),

  // List all custom resources for the org
  listCustom: protectedProcedure
    .query(async ({ ctx }) => {
      return service.listCustomResources(ctx.org.id);
    }),
});






