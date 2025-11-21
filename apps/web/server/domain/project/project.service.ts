import * as repo from './project.repo';
import { CreateProjectInput, ProjectHealth, UpdateProjectInput } from './project.schema';

export const createProjectWithDeliverables = async (orgId: string, input: CreateProjectInput) => {
  return repo.createProject(orgId, input);
};

export const updateProject = async (orgId: string, input: UpdateProjectInput) => {
  return repo.updateProject(orgId, input);
};

export const getProjectHealth = async (orgId: string, projectId: string): Promise<ProjectHealth> => {
  const project = await repo.getProjectById(orgId, projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Aggregate across deliverables
  let totalPrice = 0;
  let totalBudgetCost = 0;
  let totalActualCost = 0;
  let totalBudgetHours = 0;
  let totalActualHours = 0;

  for (const d of project.deliverables) {
    totalPrice += d.priceTotal;
    totalBudgetCost += d.budgetCost;
    totalActualCost += d.actualCost;
    totalBudgetHours += d.budgetHours;
    totalActualHours += d.actualHours;
  }

  // If project has a top-level override price, use that (unless it's 0 and we want sum)
  // Logic: If project.priceTotal is set, it overrides sum of deliverables? 
  // Or deliverables sum up to it? For simple MVP, let's assume deliverables sum up
  // unless project.priceTotal > 0 and deliverables are 0.
  // Let's just use sum of deliverables for granular billing, or project price if fixed fee.
  // We'll use sum of deliverables as the "Working" price.
  if (project.priceTotal > 0 && totalPrice === 0) {
    totalPrice = project.priceTotal;
  }

  // Margin
  const currentMarginAmount = totalPrice - totalActualCost;
  const currentMarginPct = totalPrice > 0 ? (currentMarginAmount / totalPrice) * 100 : 0;

  // Risk
  let riskScore = 0;
  
  // 1. Margin Risk
  const targetMargin = project.targetMarginPct;
  if (currentMarginPct < targetMargin) riskScore += 30;
  if (currentMarginPct < 0) riskScore += 50;

  // 2. Budget Risk (Cost)
  if (totalBudgetCost > 0 && totalActualCost > totalBudgetCost) riskScore += 40;
  else if (totalBudgetCost > 0 && totalActualCost > totalBudgetCost * 0.9) riskScore += 20;

  // 3. Schedule Risk (via hours)
  if (totalBudgetHours > 0 && totalActualHours > totalBudgetHours) riskScore += 30;

  const riskLevel = riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW';

  return {
    projectId,
    totalPrice,
    totalBudgetCost,
    totalActualCost,
    totalBudgetHours,
    totalActualHours,
    currentMarginAmount,
    currentMarginPct,
    riskScore: Math.min(riskScore, 100),
    riskLevel
  };
};

export const listProjects = repo.listProjects;
export const getProject = repo.getProjectById;
