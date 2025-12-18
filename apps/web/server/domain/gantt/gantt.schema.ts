import { z } from 'zod';
import { TaskStatus, TaskHistoryAction } from '@prisma/client';

// --- Task Schemas ---

const baseTaskSchema = z.object({
  deliverableId: z.string(),
  projectId: z.string(),
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.NOT_STARTED),
  startDate: z.date(),
  endDate: z.date(),
  estimatedHours: z.number().min(0).default(0),
  colour: z.string().optional(),
  sortOrder: z.number().int().default(0),
  dependsOn: z.array(z.string()).optional(),
});

export const createTaskSchema = baseTaskSchema.refine(
  data => data.endDate >= data.startDate, 
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

export const updateTaskSchema = baseTaskSchema.partial().extend({
  id: z.string(),
});

const baseMoveTaskSchema = z.object({
  id: z.string(),
  startDate: z.date(),
  endDate: z.date(),
});

export const moveTaskSchema = baseMoveTaskSchema.refine(
  data => data.endDate >= data.startDate, 
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

export const resizeTaskSchema = z.object({
  id: z.string(),
  endDate: z.date(),
});

export const updateTaskStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(TaskStatus),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ResizeTaskInput = z.infer<typeof resizeTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

// --- Task Resource Schemas ---

export const assignResourceSchema = z.object({
  taskId: z.string(),
  personId: z.string().optional(),
  customResourceId: z.string().optional(),
  allocatedHours: z.number().min(0).default(0),
  hourlyRate: z.number().min(0).default(0),
}).refine(data => data.personId || data.customResourceId, {
  message: "Either personId or customResourceId must be provided",
  path: ["personId"]
});

export const updateTaskResourceSchema = z.object({
  id: z.string(),
  allocatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
});

export const removeResourceSchema = z.object({
  id: z.string(), // TaskResource ID
});

export type AssignResourceInput = z.infer<typeof assignResourceSchema>;
export type UpdateTaskResourceInput = z.infer<typeof updateTaskResourceSchema>;

// --- Custom Resource Schemas ---

export const createCustomResourceSchema = z.object({
  name: z.string().min(1, "Resource name is required"),
  hourlyRate: z.number().min(0).default(0),
  description: z.string().optional(),
});

export const updateCustomResourceSchema = createCustomResourceSchema.partial().extend({
  id: z.string(),
});

export type CreateCustomResourceInput = z.infer<typeof createCustomResourceSchema>;
export type UpdateCustomResourceInput = z.infer<typeof updateCustomResourceSchema>;

// --- Theme Settings Schemas ---

export const updateThemeSettingsSchema = z.object({
  projectId: z.string().optional(),
  primaryColour: z.string().optional(),
  accentColour: z.string().optional(),
  backgroundColour: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  backgroundBlur: z.number().int().min(0).max(100).optional(),
  backgroundDim: z.number().int().min(0).max(100).optional(),
  logoUrl: z.string().optional(),
  logoOpacity: z.number().int().min(5).max(70).optional(),
  logoPosition: z.string().optional(),
});

export type UpdateThemeSettingsInput = z.infer<typeof updateThemeSettingsSchema>;

// --- User Preferences Schemas ---

export const updateUserPreferencesSchema = z.object({
  ganttZoomLevel: z.enum(["day", "week", "month", "quarter"]).optional(),
  ganttSnapToGrid: z.boolean().optional(),
  ganttShowDependencies: z.boolean().optional(),
});

export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;

// --- Gantt Highlight Schemas ---

export const createHighlightSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, "Highlight name is required"),
  startDate: z.date(),
  endDate: z.date(),
  colour: z.string().default('#e5e7eb'),
  opacity: z.number().int().min(0).max(100).default(30),
  showLabel: z.boolean().default(true),
  labelPosition: z.enum(['top', 'bottom']).default('bottom'),
}).refine(
  data => data.endDate >= data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

export const updateHighlightSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  colour: z.string().optional(),
  opacity: z.number().int().min(0).max(100).optional(),
  showLabel: z.boolean().optional(),
  labelPosition: z.enum(['top', 'bottom']).optional(),
});

export type CreateHighlightInput = z.infer<typeof createHighlightSchema>;
export type UpdateHighlightInput = z.infer<typeof updateHighlightSchema>;

// --- Capacity & Utilization DTOs ---

export interface ResourceCapacity {
  resourceId: string;
  resourceName: string;
  resourceType: 'person' | 'custom';
  weeklyHours: number;
  allocatedHours: number;
  utilizationPct: number;
  overloaded: boolean;
}

export interface WeeklyUtilization {
  weekStartDate: string;
  totalAllocated: number;
  totalCapacity: number;
  utilizationPct: number;
  overloaded: boolean;
  tasks: Array<{
    taskId: string;
    taskName: string;
    projectName: string;
    allocatedHours: number;
  }>;
}

export interface TaskWithResources {
  id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  startDate: Date;
  endDate: Date;
  estimatedHours: number;
  actualHours: number;
  costEstimated: number;
  costActual: number;
  colour: string | null;
  sortOrder: number;
  dependsOn: string[];
  deliverableId: string;
  projectId: string;
  resources: Array<{
    id: string;
    personId: string | null;
    customResourceId: string | null;
    resourceName: string;
    resourceType: 'person' | 'custom';
    allocatedHours: number;
    actualHours: number;
    hourlyRate: number;
  }>;
}

export interface GanttHighlightView {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  colour: string;
  opacity: number;
  showLabel: boolean;
  labelPosition: 'top' | 'bottom';
}

export interface GanttFullView {
  project: {
    id: string;
    name: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
  };
  deliverables: Array<{
    id: string;
    name: string;
    status: string;
    percentComplete: number;
    colour?: string | null;
    tasks: TaskWithResources[];
  }>;
  highlights: GanttHighlightView[];
  theme: {
    primaryColour: string;
    accentColour: string;
    backgroundColour: string;
    backgroundImageUrl: string | null;
    backgroundBlur: number;
    backgroundDim: number;
    logoUrl: string | null;
    logoOpacity: number;
    logoPosition: string;
  };
}





