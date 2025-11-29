import { z } from 'zod';

export const logTimeSchema = z.object({
  projectId: z.string(),
  deliverableId: z.string().optional(),
  personId: z.string(), // In real app, inferred from ctx.user
  date: z.date(),
  hours: z.number().min(0.1),
  notes: z.string().optional(),
  // Optional manual rate override
  costRateOverride: z.number().optional(),
});

export type LogTimeInput = z.infer<typeof logTimeSchema>;


