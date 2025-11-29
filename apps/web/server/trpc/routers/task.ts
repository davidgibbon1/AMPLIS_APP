import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as service from '@/server/domain/gantt/gantt.service';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  resizeTaskSchema,
  updateTaskStatusSchema
} from '@/server/domain/gantt/gantt.schema';

export const taskRouter = router({
  // List all tasks for a project
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.listTasks(input.projectId);
    }),

  // Get a single task with full details
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.getTask(input.id);
    }),

  // Create a new task
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      return service.createTask(ctx.user.id, input);
    }),

  // Update a task
  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return service.updateTask(ctx.user.id, id, data);
    }),

  // Move a task (change start/end dates)
  move: protectedProcedure
    .input(moveTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return service.moveTask(ctx.user.id, id, data);
    }),

  // Resize a task (change end date only)
  resize: protectedProcedure
    .input(resizeTaskSchema)
    .mutation(async ({ ctx, input }) => {
      return service.resizeTask(ctx.user.id, input.id, input.endDate);
    }),

  // Update task status
  updateStatus: protectedProcedure
    .input(updateTaskStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return service.updateTaskStatus(ctx.user.id, input.id, input.status);
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.deleteTask(ctx.user.id, input.id);
    }),

  // Get task history
  history: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      limit: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      return service.getTaskHistory(input.id, input.limit);
    }),
});






