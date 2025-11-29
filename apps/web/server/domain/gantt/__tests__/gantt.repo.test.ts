import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ganttRepo from '../gantt.repo';
import { prisma } from '@/lib/db/client';

// Mock Prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    themeSettings: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    task: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    taskHistory: {
      create: vi.fn(),
    },
  },
}));

describe('Gantt Repo - getThemeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query with projectId when provided', async () => {
    const mockTheme = {
      id: 'theme-1',
      orgId: 'org-1',
      projectId: 'project-1',
      primaryColour: '#3b82f6',
      accentColour: '#1e40af',
      backgroundColour: '#f8fafc',
      backgroundImageUrl: null,
      backgroundBlur: 0,
      backgroundDim: 0,
      logoUrl: null,
      logoOpacity: 30,
      logoPosition: 'bottom-right',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.themeSettings.findFirst).mockResolvedValue(mockTheme);

    const result = await ganttRepo.getThemeSettings('org-1', 'project-1');

    expect(prisma.themeSettings.findFirst).toHaveBeenCalledWith({
      where: {
        orgId: 'org-1',
        projectId: 'project-1',
      },
    });
    expect(result).toEqual(mockTheme);
  });

  it('should query with null projectId when not provided', async () => {
    const mockOrgTheme = {
      id: 'theme-org',
      orgId: 'org-1',
      projectId: null,
      primaryColour: '#ff0000',
      accentColour: '#00ff00',
      backgroundColour: '#0000ff',
      backgroundImageUrl: null,
      backgroundBlur: 5,
      backgroundDim: 10,
      logoUrl: null,
      logoOpacity: 50,
      logoPosition: 'top-left',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // When projectId is undefined, go straight to org default
    vi.mocked(prisma.themeSettings.findFirst).mockResolvedValue(mockOrgTheme);

    const result = await ganttRepo.getThemeSettings('org-1', undefined);

    // Should call findFirst to query for org default theme
    expect(prisma.themeSettings.findFirst).toHaveBeenCalledWith({
      where: {
        orgId: 'org-1',
        projectId: null,
      },
    });
    expect(result).toEqual(mockOrgTheme);
  });

  it('should fallback to org theme when project theme not found', async () => {
    const mockOrgTheme = {
      id: 'theme-org',
      orgId: 'org-1',
      projectId: null,
      primaryColour: '#ff0000',
      accentColour: '#00ff00',
      backgroundColour: '#0000ff',
      backgroundImageUrl: null,
      backgroundBlur: 5,
      backgroundDim: 10,
      logoUrl: null,
      logoOpacity: 50,
      logoPosition: 'top-left',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.themeSettings.findFirst)
      .mockResolvedValueOnce(null) // Project-specific theme not found
      .mockResolvedValueOnce(mockOrgTheme); // Org default theme found

    const result = await ganttRepo.getThemeSettings('org-1', 'project-1');

    // First call: look for project-specific theme
    expect(prisma.themeSettings.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        orgId: 'org-1',
        projectId: 'project-1',
      },
    });

    // Second call: fallback to org default
    expect(prisma.themeSettings.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        orgId: 'org-1',
        projectId: null,
      },
    });

    expect(result).toEqual(mockOrgTheme);
  });
});

describe('Gantt Repo - upsertThemeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update existing theme', async () => {
    const existingTheme = {
      id: 'theme-1',
      orgId: 'org-1',
      projectId: 'project-1',
      primaryColour: '#3b82f6',
      accentColour: '#1e40af',
      backgroundColour: '#f8fafc',
      backgroundImageUrl: null,
      backgroundBlur: 0,
      backgroundDim: 0,
      logoUrl: null,
      logoOpacity: 30,
      logoPosition: 'bottom-right',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTheme = { ...existingTheme, primaryColour: '#ff0000' };

    vi.mocked(prisma.themeSettings.findFirst).mockResolvedValue(existingTheme);
    vi.mocked(prisma.themeSettings.update).mockResolvedValue(updatedTheme);

    const result = await ganttRepo.upsertThemeSettings('org-1', 'project-1', {
      primaryColour: '#ff0000',
    });

    expect(prisma.themeSettings.findFirst).toHaveBeenCalledWith({
      where: {
        orgId: 'org-1',
        projectId: 'project-1',
      },
    });

    expect(prisma.themeSettings.update).toHaveBeenCalledWith({
      where: { id: 'theme-1' },
      data: { primaryColour: '#ff0000' },
    });

    expect(result.primaryColour).toBe('#ff0000');
  });

  it('should create new theme when not exists', async () => {
    const newTheme = {
      id: 'theme-new',
      orgId: 'org-1',
      projectId: 'project-1',
      primaryColour: '#ff0000',
      accentColour: '#1e40af',
      backgroundColour: '#f8fafc',
      backgroundImageUrl: null,
      backgroundBlur: 0,
      backgroundDim: 0,
      logoUrl: null,
      logoOpacity: 30,
      logoPosition: 'bottom-right',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.themeSettings.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.themeSettings.create).mockResolvedValue(newTheme);

    const result = await ganttRepo.upsertThemeSettings('org-1', 'project-1', {
      primaryColour: '#ff0000',
    });

    expect(prisma.themeSettings.findFirst).toHaveBeenCalledWith({
      where: {
        orgId: 'org-1',
        projectId: 'project-1',
      },
    });

    expect(prisma.themeSettings.create).toHaveBeenCalledWith({
      data: {
        orgId: 'org-1',
        projectId: 'project-1',
        primaryColour: '#ff0000',
      },
    });

    expect(result.id).toBe('theme-new');
  });

  it('should handle null projectId for org-level themes', async () => {
    const newOrgTheme = {
      id: 'theme-org',
      orgId: 'org-1',
      projectId: null,
      primaryColour: '#ff0000',
      accentColour: '#1e40af',
      backgroundColour: '#f8fafc',
      backgroundImageUrl: null,
      backgroundBlur: 0,
      backgroundDim: 0,
      logoUrl: null,
      logoOpacity: 30,
      logoPosition: 'bottom-right',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.themeSettings.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.themeSettings.create).mockResolvedValue(newOrgTheme);

    const result = await ganttRepo.upsertThemeSettings('org-1', null, {
      primaryColour: '#ff0000',
    });

    expect(prisma.themeSettings.create).toHaveBeenCalledWith({
      data: {
        orgId: 'org-1',
        projectId: null,
        primaryColour: '#ff0000',
      },
    });

    expect(result).toEqual(newOrgTheme);
  });
});

describe('Gantt Repo - JSON field handling', () => {
  it('should handle dependsOn array without stringifying', async () => {
    const mockTask = {
      id: 'task-1',
      deliverableId: 'del-1',
      projectId: 'proj-1',
      name: 'Test Task',
      description: null,
      status: 'NOT_STARTED',
      startDate: new Date(),
      endDate: new Date(),
      estimatedHours: 10,
      actualHours: 0,
      costEstimated: 1000,
      costActual: 0,
      colour: null,
      sortOrder: 0,
      dependsOn: ['task-0'],
      createdAt: new Date(),
      updatedAt: new Date(),
      resources: [],
    };

    vi.mocked(prisma.task.create).mockResolvedValue(mockTask as any);

    await ganttRepo.createTask({
      deliverableId: 'del-1',
      projectId: 'proj-1',
      name: 'Test Task',
      description: null,
      status: 'NOT_STARTED',
      startDate: new Date(),
      endDate: new Date(),
      estimatedHours: 10,
      colour: null,
      sortOrder: 0,
      dependsOn: ['task-0'],
    });

    // Verify that dependsOn is passed as-is, not stringified
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dependsOn: ['task-0'], // Should be array, not JSON string
        }),
      })
    );
  });

  it('should handle history values without stringifying', async () => {
    const mockHistory = {
      id: 'hist-1',
      taskId: 'task-1',
      userId: 'user-1',
      action: 'UPDATED',
      fieldName: 'name',
      oldValue: 'Old Name',
      newValue: 'New Name',
      createdAt: new Date(),
    };

    vi.mocked(prisma.taskHistory.create).mockResolvedValue(mockHistory as any);

    await ganttRepo.createTaskHistory(
      'task-1',
      'user-1',
      'UPDATED',
      'name',
      'Old Name',
      'New Name'
    );

    // Verify that values are passed as-is, not stringified
    expect(prisma.taskHistory.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        userId: 'user-1',
        action: 'UPDATED',
        fieldName: 'name',
        oldValue: 'Old Name', // Should be string, not JSON string
        newValue: 'New Name', // Should be string, not JSON string
      },
    });
  });
});

