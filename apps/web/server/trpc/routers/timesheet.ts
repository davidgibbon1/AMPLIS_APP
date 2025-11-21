import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as service from '@/server/domain/timesheet/timesheet.service';
import { logTimeSchema } from '@/server/domain/timesheet/timesheet.schema';

export const timesheetRouter = router({
  log: protectedProcedure
    .input(logTimeSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure person belongs to org or user is allowed
      // For now, just pass through
      return service.logTime(ctx.org.id, input);
    }),

  listRecent: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return service.getRecentTimesheets(input.projectId);
    }),
});

