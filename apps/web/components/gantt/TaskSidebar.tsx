'use client';

import { GanttDeliverable } from '@/lib/gantt/types';
import { ROW_HEIGHT } from '@/lib/gantt/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TaskSidebarProps {
  deliverables: GanttDeliverable[];
  onTaskClick: (taskId: string) => void;
  selectedTaskIds: Set<string>;
  width: number;
}

export function TaskSidebar({ deliverables, onTaskClick, selectedTaskIds, width }: TaskSidebarProps) {
  const [collapsedDeliverables, setCollapsedDeliverables] = useState<Set<string>>(new Set());
  
  const toggleDeliverable = (deliverableId: string) => {
    setCollapsedDeliverables(prev => {
      const next = new Set(prev);
      if (next.has(deliverableId)) {
        next.delete(deliverableId);
      } else {
        next.add(deliverableId);
      }
      return next;
    });
  };
  
  let rowIndex = 0;
  
  return (
    <div 
      className="bg-slate-50 border-r border-slate-200 overflow-y-auto"
      style={{ width }}
    >
      {deliverables.map((deliverable) => {
        const isCollapsed = collapsedDeliverables.has(deliverable.id);
        const deliverableRow = rowIndex++;
        
        return (
          <div key={deliverable.id}>
            {/* Deliverable Header */}
            <div
              className="flex items-center px-4 py-2 border-b border-slate-200 bg-slate-100 hover:bg-slate-200 cursor-pointer sticky z-10"
              style={{ 
                height: ROW_HEIGHT,
                top: deliverableRow * ROW_HEIGHT
              }}
              onClick={() => toggleDeliverable(deliverable.id)}
            >
              <button className="mr-2 text-slate-600">
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {deliverable.name}
                </div>
                <div className="text-xs text-slate-500">
                  {deliverable.tasks.length} tasks • {deliverable.percentComplete.toFixed(0)}% complete
                </div>
              </div>
              <div className={`
                px-2 py-1 rounded text-xs font-medium
                ${deliverable.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}
                ${deliverable.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : ''}
                ${deliverable.status === 'NOT_STARTED' ? 'bg-slate-200 text-slate-700' : ''}
                ${deliverable.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' : ''}
              `}>
                {deliverable.status.replace('_', ' ')}
              </div>
            </div>
            
            {/* Tasks */}
            {!isCollapsed && deliverable.tasks.map((task) => {
              const taskRow = rowIndex++;
              const isSelected = selectedTaskIds.has(task.id);
              
              return (
                <div
                  key={task.id}
                  className={`
                    flex items-center px-4 py-2 border-b border-slate-100 hover:bg-slate-100 cursor-pointer
                    ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                  `}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onTaskClick(task.id)}
                >
                  <input
                    type="checkbox"
                    className="mr-3"
                    checked={isSelected}
                    onChange={() => onTaskClick(task.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {task.name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      {task.resources.length > 0 && (
                        <span>{task.resources[0].resourceName}</span>
                      )}
                      <span>•</span>
                      <span>{task.estimatedHours}h</span>
                      {task.costEstimated > 0 && (
                        <>
                          <span>•</span>
                          <span>${task.costEstimated.toFixed(0)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}
                    ${task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : ''}
                    ${task.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : ''}
                    ${task.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${task.status === 'NOT_STARTED' ? 'bg-slate-200 text-slate-700' : ''}
                  `}>
                    {task.status.replace(/_/g, ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      
      {deliverables.length === 0 && (
        <div className="flex items-center justify-center h-48 text-slate-500">
          No deliverables or tasks yet
        </div>
      )}
    </div>
  );
}






