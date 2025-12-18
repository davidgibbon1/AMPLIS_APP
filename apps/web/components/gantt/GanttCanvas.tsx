'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { GanttData, GanttTask, GanttDeliverable } from '@/lib/gantt/types';
import { useGanttStore } from '@/lib/gantt/store';
import { 
  calculateTimelineRange, 
  ROW_HEIGHT,
  calculateDynamicPixelsPerDay,
} from '@/lib/gantt/utils';
import { TimelineHeader } from './TimelineHeader';
import { GridLayer, DEFAULT_GRID_SETTINGS } from './GridLayer';
import { TaskBar, TaskBarStyleConfig } from './TaskBar';
import { HighlightLayer } from './HighlightLayer';
import { THEME_PRESETS, getCategoryColor, GanttThemeConfig } from '@/lib/gantt/themes';
import { trpc } from '@/lib/trpc/client';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

// Helper to determine text color based on background
function getContrastTextColor(hexcolor: string): string {
  const hex = hexcolor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#ffffff';
}

interface GanttCanvasProps {
  projectId: string;
  data: GanttData;
  onTaskUpdate: () => void;
  themePreset?: string;
}

// Shared row data structure for alignment
interface RowData {
  type: 'deliverable' | 'task';
  id: string;
  deliverableId: string;
  deliverableName: string;
  task?: GanttTask;
  rowIndex: number;
  categoryColor: string;
  isFirstInCategory: boolean;
  isLastInCategory: boolean;
  categoryRowCount: number;
  categoryStartRow: number;
}

export function GanttCanvas({ projectId, data, onTaskUpdate, themePreset = 'corporate' }: GanttCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [collapsedDeliverables, setCollapsedDeliverables] = useState<Set<string>>(new Set());
  const [isResizing, setIsResizing] = useState(false);
  
  const {
    zoomLevel,
    timelineStart,
    timelineEnd,
    setTimelineRange,
    customTimelineStart,
    customTimelineEnd,
    canvasMinHeight,
    setCanvasMinHeight,
    selectedTaskIds,
    selectTask,
    clearSelection,
    sidebarWidth,
    setSidebarWidth
  } = useGanttStore();
  
  // State for vertical resize
  const [isVerticalResizing, setIsVerticalResizing] = useState(false);
  
  // Get theme configuration
  const theme: GanttThemeConfig = THEME_PRESETS[themePreset] || THEME_PRESETS.corporate;
  
  // TRPC mutations
  const moveTask = trpc.task.move.useMutation({ onSuccess: onTaskUpdate });
  const resizeTask = trpc.task.resize.useMutation({ onSuccess: onTaskUpdate });
  
  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Set up timeline range when project data loads (or use custom range)
  useEffect(() => {
    if (data.project) {
      // Use custom dates if set, otherwise calculate from project
      const effectiveStart = customTimelineStart || data.project.startDate;
      const effectiveEnd = customTimelineEnd || data.project.endDate;
      
      const range = calculateTimelineRange(
        effectiveStart,
        effectiveEnd,
        zoomLevel
      );
      setTimelineRange(range.start, range.end);
    }
  }, [data.project, zoomLevel, customTimelineStart, customTimelineEnd, setTimelineRange]);
  
  // Calculate pixels per day based on container width
  const pixelsPerDay = containerWidth > 0 
    ? calculateDynamicPixelsPerDay(containerWidth, timelineStart, timelineEnd)
    : 0;
  
  // Build deliverable color map
  const deliverableColors = useMemo(() => {
    const colors = new Map<string, string>();
    data.deliverables.forEach((del, index) => {
      colors.set(del.id, del.colour || getCategoryColor(index, theme.categoryColors));
    });
    return colors;
  }, [data.deliverables, theme.categoryColors]);
  
  // Toggle deliverable collapse
  const toggleDeliverable = useCallback((deliverableId: string) => {
    setCollapsedDeliverables(prev => {
      const next = new Set(prev);
      if (next.has(deliverableId)) {
        next.delete(deliverableId);
      } else {
        next.add(deliverableId);
      }
      return next;
    });
  }, []);
  
  // Build unified row data for both sidebar and canvas alignment
  const rowsData = useMemo(() => {
    const rows: RowData[] = [];
    let currentRow = 0;
    
    data.deliverables.forEach((deliverable) => {
      const isCollapsed = collapsedDeliverables.has(deliverable.id);
      const categoryColor = deliverableColors.get(deliverable.id) || '#94a3b8';
      const visibleTasks = isCollapsed ? [] : deliverable.tasks;
      const categoryRowCount = 1 + visibleTasks.length;
      const categoryStartRow = currentRow;
      
      // Deliverable header row
      rows.push({
        type: 'deliverable',
        id: deliverable.id,
        deliverableId: deliverable.id,
        deliverableName: deliverable.name,
        rowIndex: currentRow,
        categoryColor,
        isFirstInCategory: true,
        isLastInCategory: visibleTasks.length === 0,
        categoryRowCount,
        categoryStartRow
      });
      currentRow++;
      
      // Task rows
      visibleTasks.forEach((task, taskIndex) => {
        rows.push({
          type: 'task',
          id: task.id,
          deliverableId: deliverable.id,
          deliverableName: deliverable.name,
          task,
          rowIndex: currentRow,
          categoryColor,
          isFirstInCategory: false,
          isLastInCategory: taskIndex === visibleTasks.length - 1,
          categoryRowCount,
          categoryStartRow
        });
        currentRow++;
      });
    });
    
    return rows;
  }, [data.deliverables, collapsedDeliverables, deliverableColors]);
  
  // Calculate total height (respect canvasMinHeight for vertical expansion)
  const totalRows = rowsData.length;
  const contentHeight = totalRows * ROW_HEIGHT;
  const totalHeight = Math.max(contentHeight, canvasMinHeight);
  
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
  
  // Sidebar resize handler
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(600, startWidth + delta));
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth, setSidebarWidth]);
  
  // Vertical resize handler (drag bottom of canvas to expand)
  const handleVerticalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsVerticalResizing(true);
    
    const startY = e.clientY;
    const startHeight = canvasMinHeight;
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      const newHeight = Math.max(200, Math.min(2000, startHeight + delta));
      setCanvasMinHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsVerticalResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [canvasMinHeight, setCanvasMinHeight]);

  // Determine background color
  const backgroundColor = data.theme.backgroundColour || theme.backgroundColor;
  const headerHeight = zoomLevel === 'day' ? 80 : 70;

  // Build category band data for canvas background
  const categoryBands = useMemo(() => {
    const bands: Array<{
      deliverableId: string;
      color: string;
      startRow: number;
      rowCount: number;
    }> = [];
    
    let currentBand: typeof bands[0] | null = null;
    
    rowsData.forEach((row) => {
      if (row.isFirstInCategory) {
        if (currentBand) {
          bands.push(currentBand);
        }
        currentBand = {
          deliverableId: row.deliverableId,
          color: row.categoryColor,
          startRow: row.rowIndex,
          rowCount: row.categoryRowCount
        };
      }
    });
    
    if (currentBand) {
      bands.push(currentBand);
    }
    
    return bands;
  }, [rowsData]);
  
  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor }}>
      {/* Sidebar with integrated colors */}
      <div 
        className="relative bg-slate-50 border-r border-slate-200 flex-shrink-0 flex flex-col"
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar Header - matches timeline header height and style */}
        <div 
          className="flex items-center border-b border-slate-300"
          style={{ height: headerHeight }}
        >
          {/* Header category label spacer - two rows like timeline */}
          <div 
            className="flex-shrink-0 h-full flex flex-col"
            style={{ width: 50 }}
          >
            {/* Top row - dark like month band */}
            <div 
              className="flex-1"
              style={{ 
                background: theme.headerBackground.includes('gradient') 
                  ? '#1e3a5f' 
                  : theme.headerBackground 
              }}
            />
            {/* Bottom row - light like week band */}
            <div 
              className="h-[31px]"
              style={{ background: theme.weekRowBackground }}
            />
          </div>
          {/* "Item" label */}
          <div 
            className="flex-1 flex flex-col h-full"
          >
            {/* Top row - dark */}
            <div 
              className="flex-1 flex items-center justify-center font-semibold text-sm text-white"
              style={{ 
                background: theme.headerBackground.includes('gradient') 
                  ? '#1e3a5f' 
                  : theme.headerBackground 
              }}
            >
              Item
            </div>
            {/* Bottom row - light */}
            <div 
              className="h-[31px]"
              style={{ background: theme.weekRowBackground }}
            />
          </div>
        </div>
        
        {/* Sidebar Content - with vertical category labels */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex">
          {/* Vertical Category Labels Column */}
          <div className="relative flex-shrink-0" style={{ width: 50 }}>
            {categoryBands.map((band) => {
              const deliv = data.deliverables.find(d => d.id === band.deliverableId);
              const textColor = getContrastTextColor(band.color);
              const bandHeight = band.rowCount * ROW_HEIGHT;
              
              return (
                <div
                  key={`cat-label-${band.deliverableId}`}
                  className="absolute left-0 right-0 flex items-center justify-center overflow-hidden"
                  style={{
                    top: band.startRow * ROW_HEIGHT,
                    height: bandHeight,
                    backgroundColor: band.color,
                    borderBottom: '2px solid rgba(0,0,0,0.15)'
                  }}
                >
                  {bandHeight >= 44 && (
                    <div
                      className="font-bold text-[11px] tracking-wide px-1"
                      style={{
                        color: textColor,
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        transform: 'rotate(180deg)',
                        maxHeight: bandHeight - 8,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                      }}
                      title={deliv?.name}
                    >
                      {deliv?.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Row Content */}
          <div className="flex-1 min-w-0">
            {rowsData.map((row) => {
              if (row.type === 'deliverable') {
                const deliverable = data.deliverables.find(d => d.id === row.deliverableId)!;
                const isCollapsed = collapsedDeliverables.has(deliverable.id);
                
                return (
                  <div
                    key={`sidebar-${row.id}`}
                    className="relative flex items-center cursor-pointer hover:bg-slate-100 transition-colors"
                    style={{ 
                      height: ROW_HEIGHT,
                      borderBottom: row.isLastInCategory ? '2px solid #94a3b8' : '1px solid #e2e8f0',
                      backgroundColor: `${row.categoryColor}15`
                    }}
                    onClick={() => toggleDeliverable(deliverable.id)}
                  >
                    <div className="flex items-center flex-1 px-3">
                      <button className="mr-2 text-slate-600">
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate text-sm">
                          {deliverable.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {deliverable.tasks.length} tasks • {deliverable.percentComplete.toFixed(0)}% complete
                        </div>
                      </div>
                      <div className={`
                        ml-2 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap
                        ${deliverable.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}
                        ${deliverable.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : ''}
                        ${deliverable.status === 'NOT_STARTED' ? 'bg-slate-200 text-slate-700' : ''}
                        ${deliverable.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' : ''}
                      `}>
                        {deliverable.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Task row
                const task = row.task!;
                const isSelected = selectedTaskIds.has(task.id);
                
                return (
                  <div
                    key={`sidebar-${row.id}`}
                    className={`
                      relative flex items-center cursor-pointer transition-colors
                      ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}
                    `}
                    style={{ 
                      height: ROW_HEIGHT,
                      borderBottom: row.isLastInCategory ? '2px solid #94a3b8' : '1px solid #f1f5f9'
                    }}
                    onClick={() => selectTask(task.id)}
                  >
                    <div className="flex items-center flex-1 px-3">
                      <input
                        type="checkbox"
                        className="mr-3 rounded border-slate-300"
                        checked={isSelected}
                        onChange={() => selectTask(task.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {task.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          {task.resources.length > 0 && (
                            <>
                              <span className="truncate max-w-[80px]">{task.resources[0].resourceName}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{task.estimatedHours}h</span>
                        </div>
                      </div>
                      <div className={`
                        ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap
                        ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}
                        ${task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : ''}
                        ${task.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : ''}
                        ${task.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${task.status === 'NOT_STARTED' ? 'bg-slate-100 text-slate-600' : ''}
                      `}>
                        {task.status.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
            
            {data.deliverables.length === 0 && (
              <div className="flex items-center justify-center h-48 text-slate-500">
                No deliverables or tasks yet
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Resize Handle */}
      <div
        className={`
          w-2 flex-shrink-0 cursor-col-resize
          hover:bg-blue-200 transition-colors group border-x border-slate-200 relative
          ${isResizing ? 'bg-blue-300' : 'bg-slate-100'}
        `}
        onMouseDown={handleResizeStart}
        style={{ touchAction: 'none' }}
      >
        {/* Center indicator */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5"
        >
          <div className="w-0.5 h-3 bg-slate-300 rounded-full group-hover:bg-blue-400 transition-colors" />
        </div>
      </div>
      
      {/* Timeline Canvas */}
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Timeline Header */}
        <TimelineHeader
          startDate={timelineStart}
          endDate={timelineEnd}
          zoomLevel={zoomLevel}
          width={containerWidth}
          pixelsPerDay={pixelsPerDay}
          theme={{
            headerBackground: theme.headerBackground.includes('gradient') 
              ? '#1e3a5f'
              : theme.headerBackground,
            headerText: theme.headerText,
            weekRowBackground: theme.weekRowBackground,
            weekRowText: theme.weekRowText
          }}
        />
        
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
          onClick={handleCanvasClick}
          style={{
            backgroundImage: data.theme.backgroundImageUrl 
              ? `url(${data.theme.backgroundImageUrl})` 
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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
          
          {/* Grid container */}
          <div 
            className="relative"
            style={{
              width: containerWidth,
              height: totalHeight,
            }}
          >
            {/* Category Color Bands - Background layer */}
            <div className="absolute inset-0 pointer-events-none">
              {categoryBands.map((band, index) => (
                <div
                  key={`band-${band.deliverableId}`}
                  className="absolute left-0 right-0"
                  style={{
                    top: band.startRow * ROW_HEIGHT,
                    height: band.rowCount * ROW_HEIGHT,
                    backgroundColor: `${band.color}18`, // ~9% opacity
                    borderBottom: '2px solid #94a3b8'
                  }}
                />
              ))}
            </div>
            
            {/* Grid Layer */}
            <GridLayer
              startDate={timelineStart}
              endDate={timelineEnd}
              pixelsPerDay={pixelsPerDay}
              totalRows={totalRows}
              totalHeight={totalHeight}
              width={containerWidth}
              zoomLevel={zoomLevel}
              settings={{
                ...theme.grid,
                // Override row lines to account for phase dividers
                rowLineColor: '#f1f5f9'
              }}
              rowsData={rowsData}
            />
            
            {/* Highlight Layer */}
            {data.highlights && data.highlights.length > 0 && (
              <HighlightLayer
                highlights={data.highlights}
                startDate={timelineStart}
                pixelsPerDay={pixelsPerDay}
                totalHeight={totalHeight}
              />
            )}
            
            {/* Task bars */}
            {rowsData
              .filter(row => row.type === 'task' && row.task)
              .map((row) => (
              <TaskBar
                  key={row.task!.id}
                  task={row.task!}
                  rowIndex={row.rowIndex}
                  pixelsPerDay={pixelsPerDay}
                  categoryColor={row.categoryColor}
                  styleConfig={theme.taskBarStyle}
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
                absolute pointer-events-none z-30
                ${data.theme.logoPosition === 'bottom-right' ? 'bottom-4 right-4' : ''}
                ${data.theme.logoPosition === 'bottom-left' ? 'bottom-4 left-4' : ''}
                ${data.theme.logoPosition === 'top-right' ? 'top-4 right-4' : ''}
                ${data.theme.logoPosition === 'top-left' ? 'top-4 left-4' : ''}
              `}
              style={{
                opacity: data.theme.logoOpacity / 100,
              }}
            >
              <img 
                src={data.theme.logoUrl} 
                alt="Company logo"
                className="max-w-[180px] max-h-[80px] object-contain"
              />
            </div>
          )}
          
          {/* Vertical resize handle at bottom */}
          <div
            className={`
              absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize 
              flex items-center justify-center
              hover:bg-blue-100 transition-colors group
              ${isVerticalResizing ? 'bg-blue-200' : 'bg-slate-50'}
            `}
            onMouseDown={handleVerticalResizeStart}
            style={{ borderTop: '1px solid #e2e8f0' }}
          >
            <div className="flex gap-1 items-center">
              <div className="w-1 h-1 bg-slate-400 rounded-full group-hover:bg-blue-500 transition-colors" />
              <div className="w-1 h-1 bg-slate-400 rounded-full group-hover:bg-blue-500 transition-colors" />
              <div className="w-1 h-1 bg-slate-400 rounded-full group-hover:bg-blue-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
