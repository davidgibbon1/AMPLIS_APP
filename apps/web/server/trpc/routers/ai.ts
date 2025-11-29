import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/db/client';

export const aiRouter = router({
  // Suggest schedule for tasks in deliverables
  suggestSchedule: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      deliverableIds: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Integrate with OpenAI API
      // For now, return mock suggestions
      
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        include: {
          deliverables: {
            where: input.deliverableIds ? {
              id: { in: input.deliverableIds }
            } : undefined,
            include: {
              tasks: true
            }
          }
        }
      });
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      // Simple algorithm: distribute tasks evenly
      const suggestions = [];
      const startDate = project.startDate || new Date();
      let currentDate = new Date(startDate);
      
      for (const deliverable of project.deliverables) {
        for (const task of deliverable.tasks) {
          const estimatedDays = Math.ceil(task.estimatedHours.toNumber() / 8);
          
          suggestions.push({
            taskId: task.id,
            suggestedStartDate: new Date(currentDate),
            suggestedEndDate: new Date(currentDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000),
            confidence: 0.8,
            reasoning: 'Based on estimated hours and sequential scheduling'
          });
          
          // Move to next task start
          currentDate = new Date(currentDate.getTime() + (estimatedDays + 1) * 24 * 60 * 60 * 1000);
        }
      }
      
      return {
        suggestions,
        message: 'AI-generated schedule suggestions ready'
      };
    }),
  
  // Detect scheduling conflicts
  detectConflicts: protectedProcedure
    .input(z.object({
      projectId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const tasks = await prisma.task.findMany({
        where: { projectId: input.projectId },
        include: {
          resources: {
            include: {
              person: true
            }
          }
        }
      });
      
      const conflicts = [];
      
      // Check for resource conflicts (same person on overlapping tasks)
      for (let i = 0; i < tasks.length; i++) {
        for (let j = i + 1; j < tasks.length; j++) {
          const task1 = tasks[i];
          const task2 = tasks[j];
          
          // Check if they overlap in time
          const overlaps = task1.startDate <= task2.endDate && task2.startDate <= task1.endDate;
          
          if (overlaps) {
            // Check if they share resources
            const task1People = task1.resources.filter(r => r.personId).map(r => r.personId);
            const task2People = task2.resources.filter(r => r.personId).map(r => r.personId);
            
            const sharedPeople = task1People.filter(p => task2People.includes(p));
            
            if (sharedPeople.length > 0) {
              const person = task1.resources.find(r => r.personId === sharedPeople[0])?.person;
              
              conflicts.push({
                type: 'resource_conflict',
                severity: 'high',
                task1Id: task1.id,
                task1Name: task1.name,
                task2Id: task2.id,
                task2Name: task2.name,
                resourceName: person?.name,
                message: `${person?.name} is allocated to overlapping tasks`,
                suggestion: 'Stagger task dates or assign different resources'
              });
            }
          }
        }
      }
      
      return { conflicts };
    }),
  
  // Suggest resource allocations
  suggestResources: protectedProcedure
    .input(z.object({
      taskId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        include: {
          project: {
            include: {
              org: {
                include: {
                  people: {
                    include: {
                      taskResources: {
                        include: {
                          task: true
                        }
                      },
                      orgLevel: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Calculate availability for each person during task period
      const suggestions = [];
      
      for (const person of task.project.org.people) {
        // Calculate their utilization during this period
        let allocatedHours = 0;
        
        for (const resource of person.taskResources) {
          const overlaps = resource.task.startDate <= task.endDate && task.startDate <= resource.task.endDate;
          if (overlaps) {
            allocatedHours += resource.allocatedHours.toNumber();
          }
        }
        
        const capacity = 40; // 40 hours per week
        const availabilityPct = 100 - (allocatedHours / capacity * 100);
        
        suggestions.push({
          personId: person.id,
          personName: person.name,
          orgLevel: person.orgLevel?.name,
          hourlyRate: person.defaultRate.toNumber(),
          availabilityPct,
          currentLoad: allocatedHours,
          recommended: availabilityPct > 50,
          reasoning: availabilityPct > 50 
            ? 'Good availability during task period'
            : 'Already heavily allocated'
        });
      }
      
      // Sort by availability
      suggestions.sort((a, b) => b.availabilityPct - a.availabilityPct);
      
      return { suggestions: suggestions.slice(0, 5) };
    }),
  
  // Optimize timeline to reduce conflicts and improve utilization
  optimizeTimeline: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      constraints: z.object({
        preferEvenDistribution: z.boolean().optional(),
        minimizeOverlaps: z.boolean().optional(),
        respectDependencies: z.boolean().optional()
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement genetic algorithm or similar optimization
      // For now, return simple reordering suggestions
      
      return {
        optimizations: [
          {
            type: 'reorder',
            message: 'Move Task A to start after Task B to reduce resource conflicts',
            impact: 'Reduces Jane Doe utilization from 120% to 85%'
          },
          {
            type: 'redistribute',
            message: 'Assign 20 hours from Task C to John Smith (currently at 40% utilization)',
            impact: 'Balances team utilization'
          }
        ],
        estimatedImprovement: {
          conflictsReduced: 3,
          avgUtilizationImprovement: 15
        }
      };
    }),
});






