import { prisma } from '@/lib/db/client';
import { CreateProjectInput, UpdateProjectInput, CreateDeliverableInput, UpdateDeliverableInput } from './project.schema';

export const getProjectById = async (orgId: string, projectId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    include: {
      deliverables: {
        orderBy: { createdAt: 'asc' }
      },
    },
  });

  if (!project) return null;

  return {
    ...project,
    targetMarginPct: project.targetMarginPct.toNumber(),
    priceTotal: project.priceTotal?.toNumber() || 0,
    deliverables: project.deliverables.map(d => ({
      ...d,
      priceTotal: d.priceTotal.toNumber(),
      budgetHours: d.budgetHours.toNumber(),
      budgetCost: d.budgetCost.toNumber(),
      percentComplete: d.percentComplete.toNumber(),
      actualHours: d.actualHours.toNumber(),
      actualCost: d.actualCost.toNumber(),
    })),
  };
};

export const listProjects = async (orgId: string, filter?: { status?: any; search?: string }) => {
  console.log('📋 [PROJECT_REPO] listProjects called for orgId:', orgId);
  
  const where: any = { orgId };
  
  if (filter?.status) {
    where.status = filter.status;
  }
  
  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { clientName: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      deliverables: true,
    },
  });

  console.log(`📋 [PROJECT_REPO] Found ${projects.length} projects`);

  const result = projects.map(p => ({
    ...p,
    targetMarginPct: p.targetMarginPct.toNumber(),
    priceTotal: p.priceTotal?.toNumber() || 0,
    deliverables: p.deliverables.map(d => ({
      ...d,
      priceTotal: d.priceTotal.toNumber(),
      budgetHours: d.budgetHours.toNumber(),
      budgetCost: d.budgetCost.toNumber(),
      percentComplete: d.percentComplete.toNumber(),
      actualHours: d.actualHours.toNumber(),
      actualCost: d.actualCost.toNumber(),
    })),
  }));
  
  console.log('📋 [PROJECT_REPO] Returning processed projects:', result.length);
  console.log('📋 [PROJECT_REPO] First project sample:', JSON.stringify(result[0], null, 2));
  
  return result;
};

export const createProject = async (orgId: string, data: CreateProjectInput) => {
  console.log('📝 [PROJECT_REPO] createProject called');
  console.log('📝 [PROJECT_REPO] Input data:', JSON.stringify(data, null, 2));
  
  const { deliverables, ...projectData } = data;
  
  const project = await prisma.project.create({
    data: {
      ...projectData,
      orgId,
      deliverables: deliverables ? {
        create: deliverables.map(d => ({
          ...d,
          // Default values if not provided are handled by Prisma defaults or Zod
        }))
      } : undefined,
    },
    include: { deliverables: true },
  });

  console.log('📝 [PROJECT_REPO] Project created, raw result:', project.id);

  const result = {
    ...project,
    targetMarginPct: project.targetMarginPct.toNumber(),
    priceTotal: project.priceTotal?.toNumber() || 0,
    deliverables: project.deliverables.map(d => ({
      ...d,
      priceTotal: d.priceTotal.toNumber(),
      budgetHours: d.budgetHours.toNumber(),
      budgetCost: d.budgetCost.toNumber(),
      percentComplete: d.percentComplete.toNumber(),
      actualHours: d.actualHours.toNumber(),
      actualCost: d.actualCost.toNumber(),
    })),
  };

  console.log('📝 [PROJECT_REPO] Returning processed result:', JSON.stringify(result, null, 2));
  
  return result;
};

export const updateProject = async (orgId: string, data: UpdateProjectInput) => {
  const { id, deliverables, ...projectData } = data;
  
  return prisma.project.update({
    where: { id, orgId },
    data: projectData,
  });
};

// Deliverable Repo functions

export const createDeliverable = async (projectId: string, data: CreateDeliverableInput) => {
  return prisma.deliverable.create({
    data: {
      ...data,
      projectId,
    },
  });
};

export const updateDeliverable = async (id: string, data: UpdateDeliverableInput) => {
  const { id: _, ...updateData } = data;
  return prisma.deliverable.update({
    where: { id },
    data: updateData,
  });
};

export const getDeliverableById = async (id: string) => {
  return prisma.deliverable.findUnique({ where: { id } });
};
