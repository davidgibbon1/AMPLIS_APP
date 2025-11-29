import { create } from 'zustand';
import { ZoomLevel, GanttTask, TaskDragData, TaskResizeData } from './types';

interface GanttStore {
  // Zoom & View
  zoomLevel: ZoomLevel;
  setZoomLevel: (level: ZoomLevel) => void;
  
  // Timeline Range
  timelineStart: Date;
  timelineEnd: Date;
  setTimelineRange: (start: Date, end: Date) => void;
  
  // Selected Tasks
  selectedTaskIds: Set<string>;
  selectTask: (taskId: string, multiSelect?: boolean) => void;
  deselectTask: (taskId: string) => void;
  clearSelection: () => void;
  
  // Drag & Drop State
  isDragging: boolean;
  dragData: TaskDragData | null;
  setDragging: (dragging: boolean, data?: TaskDragData) => void;
  
  // Resize State
  isResizing: boolean;
  resizeData: TaskResizeData | null;
  setResizing: (resizing: boolean, data?: TaskResizeData) => void;
  
  // Filters
  showCompletedTasks: boolean;
  setShowCompletedTasks: (show: boolean) => void;
  
  // Sidebar
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  
  // Snap to Grid
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  
  // Dependencies
  showDependencies: boolean;
  setShowDependencies: (show: boolean) => void;
  
  // Current Hover
  hoveredTaskId: string | null;
  setHoveredTask: (taskId: string | null) => void;
}

export const useGanttStore = create<GanttStore>((set) => ({
  // Initial zoom level
  zoomLevel: 'week',
  setZoomLevel: (level) => set({ zoomLevel: level }),
  
  // Initial timeline range (will be set from project data)
  timelineStart: new Date(),
  timelineEnd: new Date(),
  setTimelineRange: (start, end) => set({ timelineStart: start, timelineEnd: end }),
  
  // Selection
  selectedTaskIds: new Set(),
  selectTask: (taskId, multiSelect = false) => 
    set((state) => {
      const newSelection = multiSelect 
        ? new Set(state.selectedTaskIds).add(taskId)
        : new Set([taskId]);
      return { selectedTaskIds: newSelection };
    }),
  deselectTask: (taskId) =>
    set((state) => {
      const newSelection = new Set(state.selectedTaskIds);
      newSelection.delete(taskId);
      return { selectedTaskIds: newSelection };
    }),
  clearSelection: () => set({ selectedTaskIds: new Set() }),
  
  // Drag state
  isDragging: false,
  dragData: null,
  setDragging: (dragging, data) => 
    set({ isDragging: dragging, dragData: data || null }),
  
  // Resize state
  isResizing: false,
  resizeData: null,
  setResizing: (resizing, data) =>
    set({ isResizing: resizing, resizeData: data || null }),
  
  // Filters
  showCompletedTasks: true,
  setShowCompletedTasks: (show) => set({ showCompletedTasks: show }),
  
  // Sidebar
  sidebarWidth: 400,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  
  // Snap to grid (default on)
  snapToGrid: true,
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  
  // Dependencies
  showDependencies: false,
  setShowDependencies: (show) => set({ showDependencies: show }),
  
  // Hover
  hoveredTaskId: null,
  setHoveredTask: (taskId) => set({ hoveredTaskId: taskId }),
}));






