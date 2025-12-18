import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as service from '@/server/domain/gantt/gantt.service';
import { updateThemeSettingsSchema } from '@/server/domain/gantt/gantt.schema';

export const themeRouter = router({
  // Get theme settings (project-specific or org default)
  get: protectedProcedure
    .input(z.object({
      projectId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      return service.getThemeSettings(ctx.org.id, input.projectId);
    }),

  // Update theme settings
  update: protectedProcedure
    .input(updateThemeSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { projectId, ...data } = input;
      return service.updateThemeSettings(ctx.org.id, projectId, data);
    }),

  // Upload background image (placeholder - would integrate with file storage)
  uploadBackground: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      imageUrl: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return service.updateThemeSettings(ctx.org.id, input.projectId, {
        backgroundImageUrl: input.imageUrl
      });
    }),

  // Upload logo (placeholder - would integrate with file storage)
  uploadLogo: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      logoUrl: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return service.updateThemeSettings(ctx.org.id, input.projectId, {
        logoUrl: input.logoUrl
      });
    }),
});





