import { TaskStatus } from '@prisma/client';

export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

export interface GanttTask {
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
  resources: GanttResource[];
}

export interface GanttResource {
  id: string;
  personId: string | null;
  customResourceId: string | null;
  resourceName: string;
  resourceType: 'person' | 'custom';
  allocatedHours: number;
  actualHours: number;
  hourlyRate: number;
}

export interface GanttDeliverable {
  id: string;
  name: string;
  status: string;
  percentComplete: number;
  tasks: GanttTask[];
}

export interface GanttTheme {
  primaryColour: string;
  accentColour: string;
  backgroundColour: string;
  backgroundImageUrl: string | null;
  backgroundBlur: number;
  backgroundDim: number;
  logoUrl: string | null;
  logoOpacity: number;
  logoPosition: string;
}

export interface GanttProject {
  id: string;
  name: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

export interface GanttData {
  project: GanttProject;
  deliverables: GanttDeliverable[];
  theme: GanttTheme;
}

export interface TaskDragData {
  taskId: string;
  originalStartDate: Date;
  originalEndDate: Date;
}

export interface TaskResizeData {
  taskId: string;
  originalEndDate: Date;
  edge: 'start' | 'end';
}






