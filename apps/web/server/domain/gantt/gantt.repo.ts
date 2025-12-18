import { prisma } from '@/lib/db/client';
import { 
  CreateTaskInput, 
  UpdateTaskInput, 
  MoveTaskInput,
  ResizeTaskInput,
  UpdateTaskStatusInput,
  AssignResourceInput,
  UpdateTaskResourceInput,
  CreateCustomResourceInput,
  UpdateCustomResourceInput,
  UpdateThemeSettingsInput,
  UpdateUserPreferencesInput
} from './gantt.schema';
import { Decimal } from '@prisma/client/runtime/library';

// --- Task Repository ---

export const getTasks = async (projectId: string) => {
  return prisma.task.findMany({
    where: { projectId },
    include: {
      resources: {
        include: {
          person: true,
          customResource: true
        }
      }
    },
    orderBy: [
      { deliverableId: 'asc' },
      { sortOrder: 'asc' }
    ]
  });
};

export const getTasksByDeliverable = async (deliverableId: string) => {
  return prisma.task.findMany({
    where: { deliverableId },
    include: {
      resources: {
        include: {
          person: true,
          customResource: true
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });
};

export const getTaskById = async (taskId: string) => {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      resources: {
        include: {
          person: true,
          customResource: true
        }
      },
      deliverable: true,
      project: true
    }
  });
};

export const createTask = async (data: CreateTaskInput) => {
  const { dependsOn, ...taskData } = data;
  
  return prisma.task.create({
    data: {
      ...taskData,
      dependsOn: dependsOn ? JSON.stringify(dependsOn) : null,
    },
    include: {
      resources: {
        include: {
          person: true,
          customResource: true
        }
      }
    }
  });
};

export const updateTask = async (taskId: string, data: Partial<UpdateTaskInput>) => {
  const { id, dependsOn, ...updateData } = data;
  
  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...updateData,
      ...(dependsOn !== undefined ? { dependsOn: JSON.stringify(dependsOn) } : {}),
    },
    include: {
      resources: {
        include: {
          person: true,
          customResource: true
        }
      }
    }
  });
};

export const moveTask = async (taskId: string, data: Omit<MoveTaskInput, 'id'>) => {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      startDate: data.startDate,
      endDate: data.endDate,
    }
  });
};

export const resizeTask = async (taskId: string, endDate: Date) => {
  return prisma.task.update({
    where: { id: taskId },
    data: { endDate }
  });
};

export const updateTaskStatus = async (taskId: string, status: UpdateTaskStatusInput['status']) => {
  return prisma.task.update({
    where: { id: taskId },
    data: { status }
  });
};

export const deleteTask = async (taskId: string) => {
  return prisma.task.delete({
    where: { id: taskId }
  });
};

// --- Task Resource Repository ---

export const assignResource = async (data: AssignResourceInput) => {
  return prisma.taskResource.create({
    data: {
      taskId: data.taskId,
      personId: data.personId || null,
      customResourceId: data.customResourceId || null,
      allocatedHours: new Decimal(data.allocatedHours),
      hourlyRate: new Decimal(data.hourlyRate),
    },
    include: {
      person: true,
      customResource: true
    }
  });
};

export const updateTaskResource = async (resourceId: string, data: UpdateTaskResourceInput) => {
  const { id, ...updateData } = data;
  
  return prisma.taskResource.update({
    where: { id: resourceId },
    data: {
      ...(updateData.allocatedHours !== undefined ? { allocatedHours: new Decimal(updateData.allocatedHours) } : {}),
      ...(updateData.actualHours !== undefined ? { actualHours: new Decimal(updateData.actualHours) } : {}),
    }
  });
};

export const removeResource = async (resourceId: string) => {
  return prisma.taskResource.delete({
    where: { id: resourceId }
  });
};

export const getResourcesByTask = async (taskId: string) => {
  return prisma.taskResource.findMany({
    where: { taskId },
    include: {
      person: true,
      customResource: true
    }
  });
};

// --- Custom Resource Repository ---

export const createCustomResource = async (orgId: string, data: CreateCustomResourceInput) => {
  return prisma.customResource.create({
    data: {
      ...data,
      orgId,
      hourlyRate: new Decimal(data.hourlyRate),
    }
  });
};

export const updateCustomResource = async (resourceId: string, data: Partial<UpdateCustomResourceInput>) => {
  const { id, ...updateData } = data;
  
  return prisma.customResource.update({
    where: { id: resourceId },
    data: {
      ...updateData,
      ...(updateData.hourlyRate !== undefined ? { hourlyRate: new Decimal(updateData.hourlyRate) } : {}),
    }
  });
};

export const deleteCustomResource = async (resourceId: string) => {
  return prisma.customResource.delete({
    where: { id: resourceId }
  });
};

export const listCustomResources = async (orgId: string) => {
  return prisma.customResource.findMany({
    where: { orgId },
    orderBy: { name: 'asc' }
  });
};

// --- Theme Settings Repository ---

export const getThemeSettings = async (orgId: string, projectId?: string) => {
  // First try to get project-specific theme
  if (projectId) {
    const projectTheme = await prisma.themeSettings.findUnique({
      where: {
        orgId_projectId: {
          orgId,
          projectId
        }
      }
    });
    if (projectTheme) return projectTheme;
  }
  
  // Fall back to org default (projectId = null)
  // Use findFirst since findUnique doesn't work with null in compound keys
  return prisma.themeSettings.findFirst({
    where: {
      orgId,
      projectId: null
    }
  });
};

export const upsertThemeSettings = async (
  orgId: string, 
  projectId: string | undefined | null,
  data: UpdateThemeSettingsInput
) => {
  // For org defaults (null projectId), we need to use findFirst + create/update pattern
  // because upsert doesn't work with null in compound keys
  if (!projectId) {
    const existing = await prisma.themeSettings.findFirst({
      where: { orgId, projectId: null }
    });
    
    if (existing) {
      return prisma.themeSettings.update({
        where: { id: existing.id },
        data
      });
    }
    
    return prisma.themeSettings.create({
      data: {
        orgId,
        projectId: null,
        ...data
      }
    });
  }
  
  // For project-specific themes, upsert works fine
  return prisma.themeSettings.upsert({
    where: {
      orgId_projectId: {
        orgId,
        projectId
      }
    },
    create: {
      orgId,
      projectId,
      ...data
    },
    update: data
  });
};

// --- User Preferences Repository ---

export const getUserPreferences = async (userId: string) => {
  return prisma.userPreferences.findUnique({
    where: { userId }
  });
};

export const upsertUserPreferences = async (userId: string, data: UpdateUserPreferencesInput) => {
  return prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      ...data
    },
    update: data
  });
};

// --- Task History Repository ---

export const getTaskHistory = async (taskId: string, limit: number = 50) => {
  return prisma.taskHistory.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

export const createTaskHistory = async (
  taskId: string,
  userId: string,
  action: any,
  fieldName?: string,
  oldValue?: any,
  newValue?: any
) => {
  return prisma.taskHistory.create({
    data: {
      taskId,
      userId,
      action,
      fieldName,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null
    }
  });
};

// --- Capacity & Utilization Queries ---

export const getResourceCapacity = async (
  orgId: string, 
  startDate: Date, 
  endDate: Date
) => {
  // Get all people in the org
  const people = await prisma.person.findMany({
    where: { orgId },
    include: {
      taskResources: {
        include: {
          task: {
            where: {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } }
              ]
            }
          }
        }
      }
    }
  });
  
  return people;
};

export const getPersonUtilization = async (
  personId: string,
  startDate: Date,
  endDate: Date
) => {
  const taskResources = await prisma.taskResource.findMany({
    where: {
      personId,
      task: {
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } }
        ]
      }
    },
    include: {
      task: {
        include: {
          project: true
        }
      }
    }
  });
  
  return taskResources;
};





