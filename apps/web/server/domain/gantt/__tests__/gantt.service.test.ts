import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ganttService from '../gantt.service';
import * as ganttRepo from '../gantt.repo';
import { prisma } from '@/lib/db/client';

// Mock the dependencies
vi.mock('../gantt.repo');
vi.mock('@/lib/db/client', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
    },
    themeSettings: {
      findFirst: vi.fn(),
    },
  },
}));

describe('Gantt Service - getThemeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle projectId correctly when provided', async () => {
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

    vi.mocked(ganttRepo.getThemeSettings).mockResolvedValue(mockTheme);

    const result = await ganttService.getThemeSettings('org-1', 'project-1');

    expect(ganttRepo.getThemeSettings).toHaveBeenCalledWith('org-1', 'project-1');
    expect(result).toEqual(mockTheme);
  });

  it('should return default theme when no theme found', async () => {
    vi.mocked(ganttRepo.getThemeSettings).mockResolvedValue(null);

    const result = await ganttService.getThemeSettings('org-1', 'project-1');

    expect(result).toEqual({
      primaryColour: '#3b82f6',
      accentColour: '#1e40af',
      backgroundColour: '#f8fafc',
      backgroundImageUrl: null,
      backgroundBlur: 0,
      backgroundDim: 0,
      logoUrl: null,
      logoOpacity: 30,
      logoPosition: 'bottom-right',
    });
  });

  it('should handle undefined projectId (org-level theme)', async () => {
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

    vi.mocked(ganttRepo.getThemeSettings).mockResolvedValue(mockOrgTheme);

    const result = await ganttService.getThemeSettings('org-1', undefined);

    expect(ganttRepo.getThemeSettings).toHaveBeenCalledWith('org-1', undefined);
    expect(result).toEqual(mockOrgTheme);
  });
});

describe('Gantt Service - getGanttFullView', () => {
  it('should fetch project data and theme correctly', async () => {
    const mockProject = {
      id: 'project-1',
      orgId: 'org-1',
      name: 'Test Project',
      clientName: 'Test Client',
      description: null,
      status: 'ACTIVE' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      currency: 'USD',
      targetMarginPct: 20,
      priceTotal: 100000,
      createdAt: new Date(),
      updatedAt: new Date(),
      deliverables: [],
    };

    const mockTheme = {
      id: 'theme-1',
      orgId: 'org-1',
      projectId: 'project-1',
      primaryColour: '#ff0000',
      accentColour: '#00ff00',
      backgroundColour: '#0000ff',
      backgroundImageUrl: null,
      backgroundBlur: 5,
      backgroundDim: 10,
      logoUrl: null,
      logoOpacity: 50,
      logoPosition: 'bottom-right',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject as any);
    vi.mocked(ganttRepo.getTasks).mockResolvedValue([]);
    vi.mocked(ganttRepo.getThemeSettings).mockResolvedValue(mockTheme);

    const result = await ganttService.getGanttFullView('org-1', 'project-1');

    expect(result.project.id).toBe('project-1');
    expect(result.theme.primaryColour).toBe('#ff0000');
    expect(ganttRepo.getThemeSettings).toHaveBeenCalledWith('org-1', 'project-1');
  });
});

