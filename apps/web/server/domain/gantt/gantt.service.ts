import * as repo from './gantt.repo';
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
  UpdateUserPreferencesInput,
  ResourceCapacity,
  WeeklyUtilization,
  TaskWithResources,
  GanttFullView
} from './gantt.schema';
import { prisma } from '@/lib/db/client';
import { TaskHistoryAction } from '@prisma/client';

// --- Task Service ---

export const listTasks = async (projectId: string): Promise<TaskWithResources[]> => {
  const tasks = await repo.getTasks(projectId);
  
  return tasks.map(task => ({
    id: task.id,
    name: task.name,
    description: task.description,
    status: task.status,
    startDate: task.startDate,
    endDate: task.endDate,
    estimatedHours: task.estimatedHours.toNumber(),
    actualHours: task.actualHours.toNumber(),
    costEstimated: task.costEstimated.toNumber(),
    costActual: task.costActual.toNumber(),
    colour: task.colour,
    sortOrder: task.sortOrder,
    dependsOn: task.dependsOn ? JSON.parse(task.dependsOn as string) : [],
    deliverableId: task.deliverableId,
    projectId: task.projectId,
    resources: task.resources.map(r => ({
      id: r.id,
      personId: r.personId,
      customResourceId: r.customResourceId,
      resourceName: r.person ? r.person.name : r.customResource?.name || 'Unknown',
      resourceType: r.personId ? 'person' as const : 'custom' as const,
      allocatedHours: r.allocatedHours.toNumber(),
      actualHours: r.actualHours.toNumber(),
      hourlyRate: r.hourlyRate.toNumber(),
    }))
  }));
};

export const getTask = async (taskId: string) => {
  const task = await repo.getTaskById(taskId);
  if (!task) return null;
  
  return {
    ...task,
    estimatedHours: task.estimatedHours.toNumber(),
    actualHours: task.actualHours.toNumber(),
    costEstimated: task.costEstimated.toNumber(),
    costActual: task.costActual.toNumber(),
    dependsOn: task.dependsOn ? JSON.parse(task.dependsOn as string) : [],
    resources: task.resources.map(r => ({
      id: r.id,
      personId: r.personId,
      customResourceId: r.customResourceId,
      resourceName: r.person ? r.person.name : r.customResource?.name || 'Unknown',
      resourceType: r.personId ? 'person' as const : 'custom' as const,
      allocatedHours: r.allocatedHours.toNumber(),
      actualHours: r.actualHours.toNumber(),
      hourlyRate: r.hourlyRate.toNumber(),
    }))
  };
};

export const createTask = async (userId: string, data: CreateTaskInput) => {
  const task = await repo.createTask(data);
  
  // Create history entry
  await repo.createTaskHistory(
    task.id,
    userId,
    TaskHistoryAction.CREATED,
    undefined,
    undefined,
    data
  );
  
  return task;
};

export const updateTask = async (userId: string, taskId: string, data: Partial<UpdateTaskInput>) => {
  const oldTask = await repo.getTaskById(taskId);
  if (!oldTask) throw new Error('Task not found');
  
  const task = await repo.updateTask(taskId, data);
  
  // Create history entry for each changed field
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'id' && (oldTask as any)[key] !== value) {
      await repo.createTaskHistory(
        taskId,
        userId,
        TaskHistoryAction.UPDATED,
        key,
        (oldTask as any)[key],
        value
      );
    }
  }
  
  return task;
};

export const moveTask = async (userId: string, taskId: string, data: Omit<MoveTaskInput, 'id'>) => {
  const oldTask = await repo.getTaskById(taskId);
  if (!oldTask) throw new Error('Task not found');
  
  const task = await repo.moveTask(taskId, data);
  
  // Create history entry
  await repo.createTaskHistory(
    taskId,
    userId,
    TaskHistoryAction.MOVED,
    'dates',
    { startDate: oldTask.startDate, endDate: oldTask.endDate },
    data
  );
  
  return task;
};

export const resizeTask = async (userId: string, taskId: string, endDate: Date) => {
  const oldTask = await repo.getTaskById(taskId);
  if (!oldTask) throw new Error('Task not found');
  
  const task = await repo.resizeTask(taskId, endDate);
  
  // Create history entry
  await repo.createTaskHistory(
    taskId,
    userId,
    TaskHistoryAction.RESIZED,
    'endDate',
    oldTask.endDate,
    endDate
  );
  
  return task;
};

export const updateTaskStatus = async (userId: string, taskId: string, status: UpdateTaskStatusInput['status']) => {
  const oldTask = await repo.getTaskById(taskId);
  if (!oldTask) throw new Error('Task not found');
  
  const task = await repo.updateTaskStatus(taskId, status);
  
  // Create history entry
  await repo.createTaskHistory(
    taskId,
    userId,
    TaskHistoryAction.STATUS_CHANGED,
    'status',
    oldTask.status,
    status
  );
  
  // If task is marked as completed, update actual hours/cost
  if (status === 'COMPLETED') {
    await recalculateTaskCost(taskId);
  }
  
  return task;
};

export const deleteTask = async (userId: string, taskId: string) => {
  const task = await repo.getTaskById(taskId);
  if (!task) throw new Error('Task not found');
  
  // Create history entry before deletion
  await repo.createTaskHistory(
    taskId,
    userId,
    TaskHistoryAction.DELETED,
    undefined,
    task,
    undefined
  );
  
  return repo.deleteTask(taskId);
};

export const getTaskHistory = (taskId: string, limit?: number) => {
  return repo.getTaskHistory(taskId, limit);
};

// --- Resource Service ---

export const assignResource = async (userId: string, data: AssignResourceInput) => {
  // Get hourly rate if not provided
  let hourlyRate = data.hourlyRate;
  
  if (hourlyRate === 0) {
    if (data.personId) {
      const person = await prisma.person.findUnique({ where: { id: data.personId } });
      if (person) {
        hourlyRate = person.defaultRate.toNumber();
      }
    } else if (data.customResourceId) {
      const customResource = await prisma.customResource.findUnique({ 
        where: { id: data.customResourceId } 
      });
      if (customResource) {
        hourlyRate = customResource.hourlyRate.toNumber();
      }
    }
  }
  
  const resource = await repo.assignResource({
    ...data,
    hourlyRate
  });
  
  // Create history entry
  await repo.createTaskHistory(
    data.taskId,
    userId,
    TaskHistoryAction.RESOURCE_ASSIGNED,
    'resource',
    undefined,
    { personId: data.personId, customResourceId: data.customResourceId }
  );
  
  // Recalculate task cost
  await recalculateTaskCost(data.taskId);
  
  return resource;
};

export const removeResource = async (userId: string, resourceId: string) => {
  const resource = await prisma.taskResource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new Error('Resource assignment not found');
  
  await repo.removeResource(resourceId);
  
  // Create history entry
  await repo.createTaskHistory(
    resource.taskId,
    userId,
    TaskHistoryAction.RESOURCE_REMOVED,
    'resource',
    { personId: resource.personId, customResourceId: resource.customResourceId },
    undefined
  );
  
  // Recalculate task cost
  await recalculateTaskCost(resource.taskId);
};

export const updateTaskResource = async (resourceId: string, data: UpdateTaskResourceInput) => {
  return repo.updateTaskResource(resourceId, data);
};

// --- Custom Resource Service ---

export const createCustomResource = async (orgId: string, data: CreateCustomResourceInput) => {
  return repo.createCustomResource(orgId, data);
};

export const updateCustomResource = async (resourceId: string, data: Partial<UpdateCustomResourceInput>) => {
  return repo.updateCustomResource(resourceId, data);
};

export const deleteCustomResource = async (resourceId: string) => {
  return repo.deleteCustomResource(resourceId);
};

export const listCustomResources = async (orgId: string) => {
  return repo.listCustomResources(orgId);
};

// --- Theme Service ---

export const getThemeSettings = async (orgId: string, projectId?: string) => {
  const theme = await repo.getThemeSettings(orgId, projectId);
  
  // Return default theme if not found
  if (!theme) {
    return {
      primaryColour: '#3b82f6',
      accentColour: '#1e40af',
      backgroundColour: '#f8fafc',
      backgroundImageUrl: null,
      backgroundBlur: 0,
      backgroundDim: 0,
      logoUrl: null,
      logoOpacity: 30,
      logoPosition: 'bottom-right'
    };
  }
  
  return theme;
};

export const updateThemeSettings = async (
  orgId: string,
  projectId: string | undefined | null,
  data: UpdateThemeSettingsInput
) => {
  return repo.upsertThemeSettings(orgId, projectId, data);
};

// --- User Preferences Service ---

export const getUserPreferences = async (userId: string) => {
  const prefs = await repo.getUserPreferences(userId);
  
  // Return defaults if not found
  if (!prefs) {
    return {
      ganttZoomLevel: 'week',
      ganttSnapToGrid: true,
      ganttShowDependencies: false
    };
  }
  
  return prefs;
};

export const updateUserPreferences = async (userId: string, data: UpdateUserPreferencesInput) => {
  return repo.upsertUserPreferences(userId, data);
};

// --- Capacity & Utilization Service ---

export const getResourceCapacity = async (
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<ResourceCapacity[]> => {
  const people = await repo.getResourceCapacity(orgId, startDate, endDate);
  
  const capacities: ResourceCapacity[] = [];
  
  for (const person of people) {
    // Calculate total allocated hours in the period
    let totalAllocated = 0;
    
    for (const taskResource of person.taskResources) {
      // Calculate overlap between task dates and requested period
      const taskStart = taskResource.task.startDate > startDate ? taskResource.task.startDate : startDate;
      const taskEnd = taskResource.task.endDate < endDate ? taskResource.task.endDate : endDate;
      
      if (taskStart <= taskEnd) {
        // Calculate days of overlap
        const daysOverlap = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
        const weeksOverlap = daysOverlap / 7;
        
        // Distribute allocated hours proportionally
        totalAllocated += taskResource.allocatedHours.toNumber() * weeksOverlap;
      }
    }
    
    // Assuming 40 hours per week capacity
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = totalDays / 7;
    const weeklyCapacity = 40;
    const totalCapacity = weeklyCapacity * totalWeeks;
    
    const utilizationPct = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;
    
    capacities.push({
      resourceId: person.id,
      resourceName: person.name,
      resourceType: 'person',
      weeklyHours: weeklyCapacity,
      allocatedHours: totalAllocated,
      utilizationPct,
      overloaded: utilizationPct > 100
    });
  }
  
  return capacities;
};

export const getPersonUtilization = async (
  personId: string,
  startDate: Date,
  endDate: Date
): Promise<WeeklyUtilization[]> => {
  const taskResources = await repo.getPersonUtilization(personId, startDate, endDate);
  
  // Group by week
  const weekMap = new Map<string, WeeklyUtilization>();
  
  for (const taskResource of taskResources) {
    const task = taskResource.task;
    
    // Calculate which weeks this task spans
    let currentDate = new Date(Math.max(task.startDate.getTime(), startDate.getTime()));
    const taskEndDate = new Date(Math.min(task.endDate.getTime(), endDate.getTime()));
    
    while (currentDate <= taskEndDate) {
      // Get Monday of the current week
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekStartDate: weekKey,
          totalAllocated: 0,
          totalCapacity: 40,
          utilizationPct: 0,
          overloaded: false,
          tasks: []
        });
      }
      
      const week = weekMap.get(weekKey)!;
      
      // Distribute hours proportionally across weeks
      const taskDurationWeeks = (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
      const hoursThisWeek = taskResource.allocatedHours.toNumber() / (taskDurationWeeks || 1);
      
      week.totalAllocated += hoursThisWeek;
      week.tasks.push({
        taskId: task.id,
        taskName: task.name,
        projectName: task.project.name,
        allocatedHours: hoursThisWeek
      });
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }
  }
  
  // Calculate utilization percentages
  const weeks = Array.from(weekMap.values());
  weeks.forEach(week => {
    week.utilizationPct = (week.totalAllocated / week.totalCapacity) * 100;
    week.overloaded = week.utilizationPct > 100;
  });
  
  return weeks.sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
};

// --- Full Gantt View Service ---

export const getGanttFullView = async (orgId: string, projectId: string): Promise<GanttFullView> => {
  // Get project with deliverables
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    include: {
      deliverables: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Get all tasks for this project
  const tasks = await listTasks(projectId);
  
  // Group tasks by deliverable
  const tasksByDeliverable = tasks.reduce((acc, task) => {
    if (!acc[task.deliverableId]) {
      acc[task.deliverableId] = [];
    }
    acc[task.deliverableId].push(task);
    return acc;
  }, {} as Record<string, TaskWithResources[]>);
  
  // Get theme
  const theme = await getThemeSettings(orgId, projectId);
  
  return {
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate
    },
    deliverables: project.deliverables.map(d => ({
      id: d.id,
      name: d.name,
      status: d.status,
      percentComplete: d.percentComplete.toNumber(),
      tasks: tasksByDeliverable[d.id] || []
    })),
    theme
  };
};

// --- Helper Functions ---

async function recalculateTaskCost(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      resources: true
    }
  });
  
  if (!task) return;
  
  // Calculate estimated cost based on allocated hours
  let costEstimated = 0;
  let costActual = 0;
  
  for (const resource of task.resources) {
    costEstimated += resource.allocatedHours.toNumber() * resource.hourlyRate.toNumber();
    costActual += resource.actualHours.toNumber() * resource.hourlyRate.toNumber();
  }
  
  // Update task
  await prisma.task.update({
    where: { id: taskId },
    data: {
      costEstimated,
      costActual
    }
  });
}






