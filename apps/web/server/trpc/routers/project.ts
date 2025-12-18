import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as service from '@/server/domain/project/project.service';
import { createProjectSchema, updateProjectSchema } from '@/server/domain/project/project.schema';

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.any().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return service.listProjects(ctx.org.id, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await service.getProject(ctx.org.id, input.id);
      if (!project) return null;
      return project;
    }),

  getWithHealth: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [project, health] = await Promise.all([
        service.getProject(ctx.org.id, input.id),
        service.getProjectHealth(ctx.org.id, input.id)
      ]);
      
      if (!project) return null;
      
      return {
        ...project,
        health
      };
    }),

  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      return service.createProjectWithDeliverables(ctx.org.id, input);
    }),

  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      return service.updateProject(ctx.org.id, input);
    }),
});
