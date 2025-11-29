import { router } from '../trpc';
import { projectRouter } from './project';
import { deliverableRouter } from './deliverable';
import { timesheetRouter } from './timesheet';
import { orgRouter } from './org';
import { taskRouter } from './task';
import { resourceRouter } from './resource';
import { themeRouter } from './theme';
import { ganttRouter } from './gantt';
import { aiRouter } from './ai';

export const appRouter = router({
  project: projectRouter,
  deliverable: deliverableRouter,
  timesheet: timesheetRouter,
  org: orgRouter,
  task: taskRouter,
  resource: resourceRouter,
  theme: themeRouter,
  gantt: ganttRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
