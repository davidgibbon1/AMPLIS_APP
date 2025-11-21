import { router } from '../trpc';
import { projectRouter } from './project';
import { deliverableRouter } from './deliverable';
import { timesheetRouter } from './timesheet';

export const appRouter = router({
  project: projectRouter,
  deliverable: deliverableRouter,
  timesheet: timesheetRouter,
});

export type AppRouter = typeof appRouter;
