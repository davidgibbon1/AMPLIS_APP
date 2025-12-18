'use client';

import { useMemo } from 'react';
import { 
  dateToXDynamic,
  ROW_HEIGHT,
  getTodayXPosition
} from '@/lib/gantt/utils';
import { ZoomLevel } from '@/lib/gantt/types';
import { 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval,
  isWeekend,
} from 'date-fns';

export interface GridSettings {
  // Horizontal lines
  showRowLines: boolean;
  rowLineColor: string;
  alternateRowBackground: boolean;
  alternateRowColor: string;
  
  // Vertical lines
  showDayLines: boolean;
  showWeekLines: boolean;
  showMonthLines: boolean;
  dayLineColor: string;
  weekLineColor: string;
  monthLineColor: string;
  
  // Weekend highlighting
  showWeekendHighlight: boolean;
  weekendColor: string;
  
  // Today line
  todayLineColor: string;
  todayLineWidth: number;
  showTodayHighlight: boolean;
  todayHighlightColor: string;
}

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  showRowLines: true,
  rowLineColor: '#e2e8f0',
  alternateRowBackground: false,
  alternateRowColor: '#f8fafc',
  
  showDayLines: false, // Off by default for cleaner look
  showWeekLines: true,
  showMonthLines: true,
  dayLineColor: '#f1f5f9',
  weekLineColor: '#e2e8f0',
  monthLineColor: '#cbd5e1',
  
  showWeekendHighlight: false, // Off by default - no gaps
  weekendColor: 'rgba(248, 250, 252, 0.7)',
  
  todayLineColor: '#ef4444',
  todayLineWidth: 2,
  showTodayHighlight: false,
  todayHighlightColor: 'rgba(239, 68, 68, 0.05)'
};

interface RowData {
  type: 'deliverable' | 'task';
  id: string;
  rowIndex: number;
  isFirstInCategory: boolean;
  isLastInCategory: boolean;
}

interface GridLayerProps {
  startDate: Date;
  endDate: Date;
  pixelsPerDay: number;
  totalRows: number;
  totalHeight: number;
  width: number;
  zoomLevel: ZoomLevel;
  settings?: Partial<GridSettings>;
  rowsData?: RowData[];
}

export function GridLayer({
  startDate,
  endDate,
  pixelsPerDay,
  totalRows,
  totalHeight,
  width,
  zoomLevel,
  settings: customSettings,
  rowsData = []
}: GridLayerProps) {
  const settings = { ...DEFAULT_GRID_SETTINGS, ...customSettings };
  
  // Generate day lines
  const dayLines = useMemo(() => {
    if (!settings.showDayLines || pixelsPerDay < 5) return [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.map(day => ({
      x: dateToXDynamic(day, startDate, pixelsPerDay),
      isWeekend: isWeekend(day)
    }));
  }, [startDate, endDate, pixelsPerDay, settings.showDayLines]);

  // Generate week lines
  const weekLines = useMemo(() => {
    if (!settings.showWeekLines) return [];
    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 }
    );
    return weeks.map(week => dateToXDynamic(week, startDate, pixelsPerDay));
  }, [startDate, endDate, pixelsPerDay, settings.showWeekLines]);

  // Generate month lines
  const monthLines = useMemo(() => {
    if (!settings.showMonthLines) return [];
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    return months.map(month => dateToXDynamic(month, startDate, pixelsPerDay));
  }, [startDate, endDate, pixelsPerDay, settings.showMonthLines]);

  // Weekend highlights
  const weekendHighlights = useMemo(() => {
    if (!settings.showWeekendHighlight || pixelsPerDay < 3) return [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const highlights: Array<{ x: number; width: number }> = [];
    
    let currentHighlight: { x: number; width: number } | null = null;
    
    days.forEach((day) => {
      const x = dateToXDynamic(day, startDate, pixelsPerDay);
      if (isWeekend(day)) {
        if (!currentHighlight) {
          currentHighlight = { x, width: pixelsPerDay };
        } else {
          currentHighlight.width += pixelsPerDay;
        }
      } else if (currentHighlight) {
        highlights.push(currentHighlight);
        currentHighlight = null;
      }
    });
    
    if (currentHighlight) {
      highlights.push(currentHighlight);
    }
    
    return highlights;
  }, [startDate, endDate, pixelsPerDay, settings.showWeekendHighlight]);

  // Today position
  const todayX = getTodayXPosition(startDate, endDate, pixelsPerDay);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Weekend highlights */}
      {settings.showWeekendHighlight && weekendHighlights.map((highlight, i) => (
        <div
          key={`weekend-${i}`}
          className="absolute top-0"
          style={{
            left: highlight.x,
            width: highlight.width,
            height: totalHeight,
            backgroundColor: settings.weekendColor
          }}
        />
      ))}

      {/* Today highlight column */}
      {settings.showTodayHighlight && todayX !== null && (
        <div
          className="absolute top-0"
          style={{
            left: todayX,
            width: pixelsPerDay,
            height: totalHeight,
            backgroundColor: settings.todayHighlightColor
          }}
        />
      )}

      {/* Week lines - dashed */}
      {weekLines.map((x, i) => (
        <div
          key={`week-${i}`}
          className="absolute top-0"
          style={{
            left: x,
            width: 0,
            height: totalHeight,
            borderLeft: `1px dashed ${settings.weekLineColor}`
          }}
        />
      ))}

      {/* Month lines - solid and thicker */}
      {monthLines.map((x, i) => (
        <div
          key={`month-${i}`}
          className="absolute top-0"
          style={{
            left: x,
            width: 0,
            height: totalHeight,
            borderLeft: `2px solid ${settings.monthLineColor}`
          }}
        />
      ))}

      {/* Horizontal row lines - with phase dividers */}
      {settings.showRowLines && rowsData.length > 0 ? (
        // Use rowsData for proper dividers - dashed for tasks, solid for phases
        rowsData.map((row) => (
          <div
            key={`row-line-${row.rowIndex}`}
            className="absolute left-0 right-0"
            style={{
              top: (row.rowIndex + 1) * ROW_HEIGHT - (row.isLastInCategory ? 2 : 1),
              height: 0,
              borderTop: row.isLastInCategory 
                ? '2px solid #94a3b8' 
                : `1px dashed ${settings.rowLineColor}`
            }}
          />
        ))
      ) : (
        // Fallback to simple row lines
        Array.from({ length: totalRows + 1 }).map((_, i) => (
          <div
            key={`row-line-${i}`}
            className="absolute left-0 right-0"
            style={{
              top: i * ROW_HEIGHT,
              height: 0,
              borderTop: `1px dashed ${settings.rowLineColor}`
            }}
          />
        ))
      )}

      {/* Today line - rendered last to be on top */}
      {todayX !== null && (
        <div
          className="absolute top-0 z-10"
          style={{
            left: todayX,
            width: settings.todayLineWidth,
            height: totalHeight,
            backgroundColor: settings.todayLineColor,
            boxShadow: `0 0 8px ${settings.todayLineColor}40`
          }}
        />
      )}
    </div>
  );
}
