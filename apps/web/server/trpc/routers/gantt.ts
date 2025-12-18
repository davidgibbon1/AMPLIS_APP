import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as service from '@/server/domain/gantt/gantt.service';
import { 
  updateUserPreferencesSchema,
  createHighlightSchema,
  updateHighlightSchema
} from '@/server/domain/gantt/gantt.schema';

export const ganttRouter = router({
  // Get full Gantt view (project + deliverables + tasks + theme)
  getFullView: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.getGanttFullView(ctx.org.id, input.projectId);
    }),

  // Get user preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      return service.getUserPreferences(ctx.user.id);
    }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(updateUserPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      return service.updateUserPreferences(ctx.user.id, input);
    }),

  // Export to PDF (placeholder - would integrate with PDF generation library)
  exportPDF: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      options: z.object({
        includeResources: z.boolean().optional(),
        includeFinancials: z.boolean().optional(),
        dateRange: z.object({
          start: z.date(),
          end: z.date()
        }).optional()
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement PDF generation
      return {
        url: '/api/exports/gantt-' + input.projectId + '.pdf',
        success: true
      };
    }),

  // Export to PNG (placeholder - would integrate with screenshot/canvas library)
  exportPNG: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      width: z.number().optional(),
      height: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement PNG generation
      return {
        url: '/api/exports/gantt-' + input.projectId + '.png',
        success: true
      };
    }),

  // Generate shareable link (placeholder - would implement token-based sharing)
  shareableLink: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      expiresIn: z.number().optional() // days
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement shareable link generation with token
      const token = Math.random().toString(36).substring(7);
      return {
        url: `/share/gantt/${input.projectId}/${token}`,
        expiresAt: new Date(Date.now() + (input.expiresIn || 30) * 24 * 60 * 60 * 1000)
      };
    }),

  // --- Highlight Management ---
  
  // List highlights for a project
  listHighlights: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.listHighlights(input.projectId);
    }),

  // Create a new highlight
  createHighlight: protectedProcedure
    .input(createHighlightSchema)
    .mutation(async ({ ctx, input }) => {
      return service.createHighlight(input);
    }),

  // Update a highlight
  updateHighlight: protectedProcedure
    .input(updateHighlightSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return service.updateHighlight(id, data);
    }),

  // Delete a highlight
  deleteHighlight: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.deleteHighlight(input.id);
    }),
});





