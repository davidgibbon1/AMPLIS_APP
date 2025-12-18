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

  return projects.map(p => ({
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
};

export const createProject = async (orgId: string, data: CreateProjectInput) => {
  const { deliverables, ...projectData } = data;
  
  const project = await prisma.project.create({
    data: {
      ...projectData,
      orgId,
      deliverables: deliverables ? {
        create: deliverables.map(d => ({
          ...d,
        }))
      } : undefined,
    },
    include: { deliverables: true },
  });

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
