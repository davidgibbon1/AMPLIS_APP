import { z } from 'zod';
import { ProjectStatus, DeliverableStatus, DeliverableType, BillingModel } from '@prisma/client';

// --- Deliverable Schemas ---

export const createDeliverableSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(DeliverableType).default(DeliverableType.OTHER),
  billingModel: z.nativeEnum(BillingModel).default(BillingModel.FIXED_FEE),
  priceTotal: z.number().min(0).optional(),
  budgetHours: z.number().min(0).optional(),
  budgetCost: z.number().min(0).optional(),
  status: z.nativeEnum(DeliverableStatus).optional(),
  colour: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const updateDeliverableSchema = createDeliverableSchema.partial().extend({
  id: z.string(),
  percentComplete: z.number().min(0).max(100).optional(),
});

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>;

// --- Project Schemas ---

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  clientName: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.SCOPING),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  currency: z.string().default("USD"),
  targetMarginPct: z.number().default(20),
  priceTotal: z.number().optional(),
  // Optional deliverables to create inline
  deliverables: z.array(createDeliverableSchema).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// --- Domain Types (DTOs) ---

export interface ProjectHealth {
  projectId: string;
  // Financials
  totalPrice: number;
  totalBudgetCost: number;
  totalActualCost: number;
  
  // Effort
  totalBudgetHours: number;
  totalActualHours: number;
  
  // Metrics
  currentMarginAmount: number;
  currentMarginPct: number;
  
  // Status
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
