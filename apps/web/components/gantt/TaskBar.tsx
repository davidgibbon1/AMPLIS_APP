'use client';

import { useState, useRef, useEffect } from 'react';
import { GanttTask } from '@/lib/gantt/types';
import { 
  dateToX, 
  calculateBarWidth, 
  xToDate, 
  snapToGrid,
  formatDateRange,
  ROW_HEIGHT
} from '@/lib/gantt/utils';
import { useGanttStore } from '@/lib/gantt/store';

interface TaskBarProps {
  task: GanttTask;
  rowIndex: number;
  onMove: (taskId: string, startDate: Date, endDate: Date) => void;
  onResize: (taskId: string, endDate: Date) => void;
  onClick: (task: GanttTask) => void;
}

export function TaskBar({ task, rowIndex, onMove, onResize, onClick }: TaskBarProps) {
  const { 
    zoomLevel, 
    timelineStart, 
    selectedTaskIds, 
    snapToGrid: shouldSnap,
    setHoveredTask,
    hoveredTaskId
  } = useGanttStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempDates, setTempDates] = useState({ start: task.startDate, end: task.endDate });
  
  const barRef = useRef<HTMLDivElement>(null);
  
  const isSelected = selectedTaskIds.has(task.id);
  const isHovered = hoveredTaskId === task.id;
  
  // Calculate position and width
  const x = dateToX(task.startDate, timelineStart, zoomLevel);
  const width = calculateBarWidth(task.startDate, task.endDate, zoomLevel);
  const y = rowIndex * ROW_HEIGHT;
  
  // Status color mapping
  const getStatusColor = () => {
    if (task.colour) return task.colour;
    
    switch (task.status) {
      case 'COMPLETED':
        return 'bg-green-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500';
      case 'BLOCKED':
        return 'bg-red-500';
      case 'UNDER_REVIEW':
        return 'bg-yellow-500';
      default:
        return 'bg-slate-400';
    }
  };
  
  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return; // Let resize handle do its thing
    }
    
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setTempDates({ start: task.startDate, end: task.endDate });
  };
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setTempDates({ start: task.startDate, end: task.endDate });
  };
  
  // Handle mouse move (drag or resize)
  useEffect(() => {
    if (!isDragging && !isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaDate = xToDate(deltaX, new Date(0), zoomLevel);
      const daysDelta = Math.floor((deltaDate.getTime() - new Date(0).getTime()) / (1000 * 60 * 60 * 24));
      
      if (isDragging) {
        // Move entire bar
        const newStart = new Date(task.startDate);
        newStart.setDate(newStart.getDate() + daysDelta);
        
        const duration = task.endDate.getTime() - task.startDate.getTime();
        const newEnd = new Date(newStart.getTime() + duration);
        
        setTempDates({
          start: shouldSnap ? snapToGrid(newStart, zoomLevel) : newStart,
          end: shouldSnap ? snapToGrid(newEnd, zoomLevel) : newEnd
        });
      } else if (isResizing) {
        // Resize end date
        const newEnd = new Date(task.endDate);
        newEnd.setDate(newEnd.getDate() + daysDelta);
        
        // Ensure end is after start
        if (newEnd > task.startDate) {
          setTempDates({
            start: task.startDate,
            end: shouldSnap ? snapToGrid(newEnd, zoomLevel) : newEnd
          });
        }
      }
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        onMove(task.id, tempDates.start, tempDates.end);
      } else if (isResizing) {
        onResize(task.id, tempDates.end);
      }
      
      setIsDragging(false);
      setIsResizing(false);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, task, tempDates, shouldSnap, zoomLevel, onMove, onResize]);
  
  // Use temp dates during drag/resize
  const displayStartDate = isDragging || isResizing ? tempDates.start : task.startDate;
  const displayEndDate = isDragging || isResizing ? tempDates.end : task.endDate;
  const displayX = dateToX(displayStartDate, timelineStart, zoomLevel);
  const displayWidth = calculateBarWidth(displayStartDate, displayEndDate, zoomLevel);
  
  // Calculate progress bar width
  const progressPercent = task.estimatedHours > 0 
    ? Math.min((task.actualHours / task.estimatedHours) * 100, 100)
    : 0;
  
  return (
    <>
      <div
        ref={barRef}
        className={`
          absolute cursor-move rounded-md transition-shadow group
          ${getStatusColor()}
          ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
          ${isHovered ? 'shadow-lg' : 'shadow'}
          ${isDragging || isResizing ? 'opacity-70' : ''}
        `}
        style={{
          left: displayX,
          top: y + 8,
          width: Math.max(displayWidth, 40),
          height: ROW_HEIGHT - 16,
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          onClick(task);
        }}
        onMouseEnter={() => setHoveredTask(task.id)}
        onMouseLeave={() => setHoveredTask(null)}
        title={`${task.name}\n${formatDateRange(displayStartDate, displayEndDate)}\n${task.estimatedHours}h estimated`}
      >
        {/* Progress bar */}
        <div
          className="absolute inset-0 bg-white/20 rounded-md"
          style={{ width: `${progressPercent}%` }}
        />
        
        {/* Task name */}
        <div className="absolute inset-0 flex items-center px-3">
          <span className="text-white text-sm font-medium truncate">
            {task.name}
          </span>
        </div>
        
        {/* Resize handles */}
        <div
          className="resize-handle absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30"
          onMouseDown={handleResizeStart}
        />
        
        {/* Resource indicator */}
        {task.resources.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
            {task.resources.length}
          </div>
        )}
      </div>
      
      {/* Hover tooltip */}
      {isHovered && (
        <div
          className="absolute z-30 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-sm"
          style={{
            left: displayX + displayWidth + 10,
            top: y,
            minWidth: 200,
          }}
        >
          <div className="font-semibold mb-2">{task.name}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-300">Dates:</span>
              <span>{formatDateRange(task.startDate, task.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Hours:</span>
              <span>{task.actualHours} / {task.estimatedHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Cost:</span>
              <span>${task.costActual.toFixed(0)} / ${task.costEstimated.toFixed(0)}</span>
            </div>
            {task.resources.length > 0 && (
              <div className="pt-2 border-t border-slate-700">
                <div className="text-slate-300 mb-1">Resources:</div>
                {task.resources.map(r => (
                  <div key={r.id} className="flex justify-between">
                    <span>{r.resourceName}</span>
                    <span>{r.allocatedHours}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}





