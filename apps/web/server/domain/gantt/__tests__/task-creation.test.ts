import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTaskSchema } from '../gantt.schema';
import * as ganttService from '../gantt.service';
import * as ganttRepo from '../gantt.repo';
import { TaskStatus } from '@prisma/client';

vi.mock('../gantt.repo');

describe('Task Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should accept valid task with all required fields', () => {
      const validTask = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        sortOrder: 0
      };

      const result = createTaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should accept task with undefined optional fields', () => {
      const taskWithUndefined = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        description: undefined,
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        colour: undefined,
        sortOrder: 0
      };

      const result = createTaskSchema.safeParse(taskWithUndefined);
      expect(result.success).toBe(true);
    });

    it('should accept task without optional fields at all', () => {
      const taskWithoutOptional = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        sortOrder: 0
      };

      const result = createTaskSchema.safeParse(taskWithoutOptional);
      expect(result.success).toBe(true);
    });

    it('should reject task with null in optional string fields', () => {
      const taskWithNull = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        description: null, // ❌ This should fail
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        colour: null, // ❌ This should fail
        sortOrder: 0
      };

      const result = createTaskSchema.safeParse(taskWithNull);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors).toHaveLength(2);
        expect(errors[0].path).toContain('description');
        expect(errors[1].path).toContain('colour');
      }
    });

    it('should reject task with end date before start date', () => {
      const invalidTask = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-08'),
        endDate: new Date('2025-01-01'), // Before start!
        estimatedHours: 8,
        sortOrder: 0
      };

      const result = createTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('End date must be after start date');
      }
    });

    it('should reject task with empty name', () => {
      const taskWithEmptyName = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: '',
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        sortOrder: 0
      };

      const result = createTaskSchema.safeParse(taskWithEmptyName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Task name is required');
      }
    });

    it('should reject task with negative estimated hours', () => {
      const taskWithNegativeHours = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: -5,
        sortOrder: 0
      };

      const result = createTaskSchema.safeParse(taskWithNegativeHours);
      expect(result.success).toBe(false);
    });
  });

  describe('Task Service - createTask', () => {
    it('should create task successfully with valid data', async () => {
      const mockCreatedTask = {
        id: 'task-1',
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        description: null,
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        actualHours: 0,
        costEstimated: 0,
        costActual: 0,
        colour: null,
        sortOrder: 0,
        dependsOn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: []
      };

      vi.mocked(ganttRepo.createTask).mockResolvedValue(mockCreatedTask as any);
      vi.mocked(ganttRepo.createTaskHistory).mockResolvedValue({} as any);

      const taskData = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        sortOrder: 0
      };

      const result = await ganttService.createTask('user-1', taskData);

      expect(ganttRepo.createTask).toHaveBeenCalledWith(taskData);
      expect(ganttRepo.createTaskHistory).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedTask);
    });

    it('should handle task with description', async () => {
      const mockCreatedTask = {
        id: 'task-1',
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        description: 'This is a test task',
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        actualHours: 0,
        costEstimated: 0,
        costActual: 0,
        colour: null,
        sortOrder: 0,
        dependsOn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: []
      };

      vi.mocked(ganttRepo.createTask).mockResolvedValue(mockCreatedTask as any);
      vi.mocked(ganttRepo.createTaskHistory).mockResolvedValue({} as any);

      const taskData = {
        deliverableId: 'del-1',
        projectId: 'proj-1',
        name: 'Test Task',
        description: 'This is a test task',
        status: TaskStatus.NOT_STARTED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        estimatedHours: 8,
        sortOrder: 0
      };

      const result = await ganttService.createTask('user-1', taskData);

      expect(result.description).toBe('This is a test task');
    });
  });
});


