'use client';

import { useState, useRef, useEffect } from 'react';
import { GanttTask } from '@/lib/gantt/types';
import { 
  dateToXDynamic,
  calculateBarWidthDynamic,
  snapToGrid,
  formatDateRange,
  ROW_HEIGHT
} from '@/lib/gantt/utils';
import { useGanttStore } from '@/lib/gantt/store';

export interface TaskBarStyleConfig {
  borderRadius: 'none' | 'small' | 'medium' | 'full';
  showProgress: boolean;
  progressStyle: 'overlay' | 'stripe' | 'fill';
  shadow: 'none' | 'small' | 'medium';
  showLabel: boolean;
}

const DEFAULT_STYLE: TaskBarStyleConfig = {
  borderRadius: 'small',
  showProgress: true,
  progressStyle: 'overlay',
  shadow: 'small',
  showLabel: true,
};

interface TaskBarProps {
  task: GanttTask;
  rowIndex: number;
  pixelsPerDay: number;
  categoryColor?: string;
  styleConfig?: TaskBarStyleConfig;
  onMove: (taskId: string, startDate: Date, endDate: Date) => void;
  onResize: (taskId: string, endDate: Date) => void;
  onClick: (task: GanttTask) => void;
}

// Get contrasting text color
function getContrastColor(hexcolor: string): string {
  if (hexcolor.startsWith('bg-')) return '#ffffff';
  const hex = hexcolor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#ffffff';
}

// Darken a hex color
function darkenColor(hexcolor: string, percent: number): string {
  if (hexcolor.startsWith('bg-')) return hexcolor;
  const hex = hexcolor.replace('#', '');
  if (hex.length !== 6) return hexcolor;
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - percent);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - percent);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - percent);
  return `rgb(${r}, ${g}, ${b})`;
}

export function TaskBar({ 
  task, 
  rowIndex, 
  pixelsPerDay, 
  categoryColor,
  styleConfig = DEFAULT_STYLE,
  onMove, 
  onResize, 
  onClick 
}: TaskBarProps) {
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
  
  // Calculate position and width using dynamic pixels per day
  const x = dateToXDynamic(task.startDate, timelineStart, pixelsPerDay);
  const width = calculateBarWidthDynamic(task.startDate, task.endDate, pixelsPerDay);
  const y = rowIndex * ROW_HEIGHT;
  
  // Determine the bar color - priority: task.colour > categoryColor > status default
  const getBarColor = (): string => {
    if (task.colour) return task.colour;
    if (categoryColor) return categoryColor;
    
    // Status-based fallback
    switch (task.status) {
      case 'COMPLETED': return '#22c55e';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'BLOCKED': return '#ef4444';
      case 'UNDER_REVIEW': return '#eab308';
      default: return '#94a3b8';
    }
  };
  
  const barColor = getBarColor();
  const isHexColor = barColor.startsWith('#');
  const textColor = isHexColor ? getContrastColor(barColor) : '#ffffff';
  const borderColor = isHexColor ? darkenColor(barColor, 30) : 'transparent';
  
  // Border radius based on config
  const getBorderRadius = () => {
    switch (styleConfig.borderRadius) {
      case 'none': return '0px';
      case 'small': return '4px';
      case 'medium': return '6px';
      case 'full': return '9999px';
      default: return '4px';
    }
  };
  
  // Shadow based on config
  const getShadow = () => {
    if (isDragging || isResizing) return 'none';
    switch (styleConfig.shadow) {
      case 'none': return 'none';
      case 'small': return '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)';
      case 'medium': return '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)';
      default: return '0 1px 3px rgba(0,0,0,0.12)';
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
  
  // Resize edge state
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end'>('end');
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, edge: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeEdge(edge);
    setDragStart({ x: e.clientX, y: e.clientY });
    setTempDates({ start: task.startDate, end: task.endDate });
  };
  
  // Handle mouse move (drag or resize)
  useEffect(() => {
    if (!isDragging && !isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      // Calculate days delta using pixels per day
      const daysDelta = pixelsPerDay > 0 ? Math.round(deltaX / pixelsPerDay) : 0;
      
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
        if (resizeEdge === 'end') {
          // Resize end date
          const newEnd = new Date(task.endDate);
          newEnd.setDate(newEnd.getDate() + daysDelta);
          
          // Ensure end is after start (minimum 1 day)
          if (newEnd > task.startDate) {
            setTempDates({
              start: task.startDate,
              end: shouldSnap ? snapToGrid(newEnd, zoomLevel) : newEnd
            });
          }
        } else {
          // Resize start date
          const newStart = new Date(task.startDate);
          newStart.setDate(newStart.getDate() + daysDelta);
          
          // Ensure start is before end (minimum 1 day)
          if (newStart < task.endDate) {
            setTempDates({
              start: shouldSnap ? snapToGrid(newStart, zoomLevel) : newStart,
              end: task.endDate
            });
          }
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
  }, [isDragging, isResizing, resizeEdge, dragStart, task, tempDates, shouldSnap, zoomLevel, pixelsPerDay, onMove, onResize]);
  
  // Use temp dates during drag/resize
  const displayStartDate = isDragging || isResizing ? tempDates.start : task.startDate;
  const displayEndDate = isDragging || isResizing ? tempDates.end : task.endDate;
  const displayX = dateToXDynamic(displayStartDate, timelineStart, pixelsPerDay);
  const displayWidth = calculateBarWidthDynamic(displayStartDate, displayEndDate, pixelsPerDay);
  
  // Calculate progress bar width
  const progressPercent = task.estimatedHours > 0 
    ? Math.min((task.actualHours / task.estimatedHours) * 100, 100)
    : 0;
  
  // Determine if we have enough width to show the label
  const showLabel = styleConfig.showLabel && displayWidth > 50;
  
  // Get status indicator
  const getStatusIndicator = () => {
    switch (task.status) {
      case 'COMPLETED': return '✓';
      case 'BLOCKED': return '⚠';
      default: return null;
    }
  };
  
  // Stripe pattern for progress
  const stripeBackground = styleConfig.progressStyle === 'stripe' && styleConfig.showProgress
    ? `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 8px,
        rgba(255,255,255,0.15) 8px,
        rgba(255,255,255,0.15) 16px
      )`
    : undefined;
  
  return (
    <>
      <div
        ref={barRef}
        className={`
          absolute cursor-move transition-all group
          ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1' : ''}
          ${isDragging || isResizing ? 'opacity-80 scale-[1.02]' : ''}
          ${isHovered && !isDragging ? 'brightness-110' : ''}
        `}
        style={{
          left: displayX,
          top: y + 6,
          width: Math.max(displayWidth, 24),
          height: ROW_HEIGHT - 12,
          backgroundColor: isHexColor ? barColor : undefined,
          borderRadius: getBorderRadius(),
          boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : getShadow(),
          border: isHexColor ? `1px solid ${borderColor}` : undefined,
          backgroundImage: stripeBackground,
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
        {/* Progress bar - overlay style */}
        {styleConfig.showProgress && styleConfig.progressStyle === 'overlay' && progressPercent > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-white/25"
            style={{ 
              width: `${progressPercent}%`,
              borderRadius: getBorderRadius(),
            }}
          />
        )}
        
        {/* Progress bar - fill style (darker portion for incomplete) */}
        {styleConfig.showProgress && styleConfig.progressStyle === 'fill' && (
          <div
            className="absolute inset-y-0 right-0 bg-black/20"
            style={{ 
              width: `${100 - progressPercent}%`,
              borderRadius: `0 ${getBorderRadius()} ${getBorderRadius()} 0`,
            }}
          />
        )}
        
        {/* Task content */}
        <div 
          className="absolute inset-0 flex items-center px-2 gap-1 overflow-hidden"
          style={{ color: textColor }}
        >
          {/* Status indicator */}
          {getStatusIndicator() && (
            <span className="text-xs flex-shrink-0 opacity-90">
              {getStatusIndicator()}
            </span>
          )}
          
          {/* Task name */}
          {showLabel && (
            <span className="text-xs font-medium truncate flex-1">
              {task.name}
            </span>
          )}
        </div>
        
        {/* Resize handles - both left and right */}
        <div
          className="resize-handle absolute left-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 z-10"
          style={{ backgroundColor: `${textColor}40` }}
          onMouseDown={(e) => handleResizeStart(e, 'start')}
        />
        <div
          className="resize-handle absolute right-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 z-10"
          style={{ backgroundColor: `${textColor}40` }}
          onMouseDown={(e) => handleResizeStart(e, 'end')}
        />
        
        {/* Resource indicator */}
        {task.resources.length > 0 && (
          <div 
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm"
            style={{ 
              backgroundColor: '#ffffff',
              color: barColor,
              border: `1.5px solid ${barColor}`
            }}
          >
            {task.resources.length}
          </div>
        )}
      </div>
      
      {/* Hover tooltip */}
      {isHovered && !isDragging && !isResizing && (
        <div
          className="absolute z-50 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-sm pointer-events-none"
          style={{
            left: Math.min(displayX + displayWidth + 10, width - 220),
            top: y - 10,
            minWidth: 200,
            maxWidth: 280,
          }}
        >
          <div className="font-semibold mb-2 flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: barColor }}
            />
            {task.name}
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Status:</span>
              <span className="font-medium">{task.status.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Dates:</span>
              <span>{formatDateRange(task.startDate, task.endDate)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Progress:</span>
              <span>{task.actualHours} / {task.estimatedHours}h ({Math.round(progressPercent)}%)</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Cost:</span>
              <span>${task.costActual.toLocaleString()} / ${task.costEstimated.toLocaleString()}</span>
            </div>
            {task.resources.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-700">
                <div className="text-slate-400 mb-1.5">Resources ({task.resources.length}):</div>
                <div className="space-y-1">
                  {task.resources.slice(0, 3).map(r => (
                    <div key={r.id} className="flex justify-between text-slate-300">
                      <span className="truncate">{r.resourceName}</span>
                      <span className="flex-shrink-0 ml-2">{r.allocatedHours}h</span>
                    </div>
                  ))}
                  {task.resources.length > 3 && (
                    <div className="text-slate-500 text-[10px]">
                      +{task.resources.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}





