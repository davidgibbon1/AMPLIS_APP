'use client';

import { useRef, useState, useEffect } from 'react';
import { GanttData, GanttTask } from '@/lib/gantt/types';
import { useGanttStore } from '@/lib/gantt/store';
import { calculateTimelineRange, SIDEBAR_WIDTH, ROW_HEIGHT, HEADER_HEIGHT } from '@/lib/gantt/utils';
import { Timeline } from './Timeline';
import { TaskBar } from './TaskBar';
import { TaskSidebar } from './TaskSidebar';
import { trpc } from '@/lib/trpc/client';

interface GanttCanvasProps {
  projectId: string;
  data: GanttData;
  onTaskUpdate: () => void;
}

export function GanttCanvas({ projectId, data, onTaskUpdate }: GanttCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(2000);
  
  const {
    zoomLevel,
    timelineStart,
    timelineEnd,
    setTimelineRange,
    selectedTaskIds,
    selectTask,
    clearSelection,
    sidebarWidth
  } = useGanttStore();
  
  // TRPC mutations
  const moveTask = trpc.task.move.useMutation({ onSuccess: onTaskUpdate });
  const resizeTask = trpc.task.resize.useMutation({ onSuccess: onTaskUpdate });
  
  // Set up timeline range when project data loads
  useEffect(() => {
    if (data.project) {
      const range = calculateTimelineRange(
        data.project.startDate,
        data.project.endDate,
        zoomLevel
      );
      setTimelineRange(range.start, range.end);
    }
  }, [data.project, zoomLevel, setTimelineRange]);
  
  // Calculate total rows needed
  let totalRows = 0;
  data.deliverables.forEach(d => {
    totalRows += 1; // Deliverable header
    totalRows += d.tasks.length; // Tasks
  });
  
  const totalHeight = totalRows * ROW_HEIGHT;
  
  // Handle task move
  const handleTaskMove = async (taskId: string, startDate: Date, endDate: Date) => {
    try {
      await moveTask.mutateAsync({
        id: taskId,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };
  
  // Handle task resize
  const handleTaskResize = async (taskId: string, endDate: Date) => {
    try {
      await resizeTask.mutateAsync({
        id: taskId,
        endDate
      });
    } catch (error) {
      console.error('Failed to resize task:', error);
    }
  };
  
  // Handle task click
  const handleTaskClick = (task: GanttTask) => {
    selectTask(task.id, false);
  };
  
  // Handle canvas click (deselect all)
  const handleCanvasClick = () => {
    clearSelection();
  };
  
  // Build flat task list with row indices
  const tasksWithRows: Array<{ task: GanttTask; rowIndex: number }> = [];
  let currentRow = 0;
  
  data.deliverables.forEach(deliverable => {
    currentRow++; // Skip deliverable header row
    deliverable.tasks.forEach(task => {
      tasksWithRows.push({ task, rowIndex: currentRow });
      currentRow++;
    });
  });
  
  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Sidebar */}
      <TaskSidebar
        deliverables={data.deliverables}
        onTaskClick={(taskId) => selectTask(taskId)}
        selectedTaskIds={selectedTaskIds}
        width={sidebarWidth}
      />
      
      {/* Timeline Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline Header */}
        <Timeline
          startDate={timelineStart}
          endDate={timelineEnd}
          zoomLevel={zoomLevel}
          width={canvasWidth}
        />
        
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 overflow-auto relative"
          onClick={handleCanvasClick}
          style={{
            backgroundImage: data.theme.backgroundImageUrl 
              ? `url(${data.theme.backgroundImageUrl})` 
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: data.theme.backgroundColour,
          }}
        >
          {/* Background overlay for image blur/dim */}
          {data.theme.backgroundImageUrl && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backdropFilter: `blur(${data.theme.backgroundBlur}px)`,
                backgroundColor: `rgba(0,0,0,${data.theme.backgroundDim / 100})`,
              }}
            />
          )}
          
          {/* Grid lines */}
          <div 
            className="relative"
            style={{
              width: canvasWidth,
              height: totalHeight,
            }}
          >
            {/* Vertical grid lines - could be generated based on zoom level */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: Math.ceil(canvasWidth / 100) }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-slate-100"
                  style={{ left: i * 100 }}
                />
              ))}
            </div>
            
            {/* Horizontal row lines */}
            {Array.from({ length: totalRows }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-b border-slate-100"
                style={{
                  top: i * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                }}
              />
            ))}
            
            {/* Task bars */}
            {tasksWithRows.map(({ task, rowIndex }) => (
              <TaskBar
                key={task.id}
                task={task}
                rowIndex={rowIndex}
                onMove={handleTaskMove}
                onResize={handleTaskResize}
                onClick={handleTaskClick}
              />
            ))}
          </div>
          
          {/* Logo overlay */}
          {data.theme.logoUrl && (
            <div
              className={`
                absolute 
                ${data.theme.logoPosition === 'bottom-right' ? 'bottom-8 right-8' : ''}
                ${data.theme.logoPosition === 'bottom-left' ? 'bottom-8 left-8' : ''}
                ${data.theme.logoPosition === 'top-right' ? 'top-8 right-8' : ''}
                ${data.theme.logoPosition === 'top-left' ? 'top-8 left-8' : ''}
                pointer-events-none
              `}
              style={{
                opacity: data.theme.logoOpacity / 100,
              }}
            >
              <img 
                src={data.theme.logoUrl} 
                alt="Company logo"
                className="max-w-[200px] max-h-[100px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





