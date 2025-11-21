import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as repo from '@/server/domain/project/project.repo';
import { createDeliverableSchema, updateDeliverableSchema } from '@/server/domain/project/project.schema';

export const deliverableRouter = router({
  create: protectedProcedure
    .input(z.object({ projectId: z.string(), data: createDeliverableSchema }))
    .mutation(async ({ input }) => {
      return repo.createDeliverable(input.projectId, input.data);
    }),

  update: protectedProcedure
    .input(updateDeliverableSchema)
    .mutation(async ({ input }) => {
      return repo.updateDeliverable(input.id, input);
    }),
    
  updateProgress: protectedProcedure
    .input(z.object({ 
      id: z.string(), 
      percentComplete: z.number(),
      status: z.any().optional()
    }))
    .mutation(async ({ input }) => {
      return repo.updateDeliverable(input.id, {
        id: input.id,
        percentComplete: input.percentComplete,
        status: input.status
      });
    }),
});
