'use client';

import { useMemo } from 'react';
import { 
  HEADER_HEIGHT,
  dateToXDynamic
} from '@/lib/gantt/utils';
import { ZoomLevel } from '@/lib/gantt/types';
import { 
  format, 
  eachMonthOfInterval, 
  eachWeekOfInterval,
  eachDayOfInterval,
  endOfWeek,
  getWeek,
  differenceInDays,
} from 'date-fns';

interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  zoomLevel: ZoomLevel;
  width: number;
  pixelsPerDay: number;
  theme?: {
    headerBackground: string;
    headerText: string;
    weekRowBackground: string;
    weekRowText: string;
  };
}

const DEFAULT_THEME = {
  headerBackground: '#1e3a5f',
  headerText: '#ffffff',
  weekRowBackground: '#f1f5f9',
  weekRowText: '#475569'
};

export function TimelineHeader({ 
  startDate, 
  endDate, 
  zoomLevel, 
  width, 
  pixelsPerDay,
  theme = DEFAULT_THEME
}: TimelineHeaderProps) {
  
  // Generate month intervals with their pixel positions and widths
  const monthIntervals = useMemo(() => {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    return months.map((month, index) => {
      const x = dateToXDynamic(month, startDate, pixelsPerDay);
      const nextMonth = months[index + 1];
      const monthEnd = nextMonth 
        ? new Date(nextMonth.getTime() - 1) 
        : endDate;
      const daysInView = differenceInDays(
        monthEnd > endDate ? endDate : monthEnd, 
        month < startDate ? startDate : month
      ) + 1;
      const monthWidth = daysInView * pixelsPerDay;
      
      return {
        date: month,
        label: format(month, 'MMM'),
        fullLabel: format(month, 'MMMM yyyy'),
        x: Math.max(x, 0),
        width: monthWidth
      };
    });
  }, [startDate, endDate, pixelsPerDay]);

  // Generate week intervals with visibility check
  const weekIntervals = useMemo(() => {
    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 } // Monday
    );
    
    return weeks.map((weekStart) => {
      // Calculate the visible portion of the week
      const visibleStart = weekStart < startDate ? startDate : weekStart;
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const visibleEnd = weekEnd > endDate ? endDate : weekEnd;
      
      const x = dateToXDynamic(visibleStart, startDate, pixelsPerDay);
      const daysInWeek = differenceInDays(visibleEnd, visibleStart) + 1;
      const weekWidth = daysInWeek * pixelsPerDay;
      const weekNum = getWeek(weekStart, { weekStartsOn: 1 });
      
      return {
        date: weekStart,
        weekNumber: weekNum,
        x: Math.max(x, 0),
        width: Math.max(weekWidth, 0)
      };
    }).filter(week => week.width > 0); // Only show weeks with visible width
  }, [startDate, endDate, pixelsPerDay]);

  // For day view, generate day intervals
  const dayIntervals = useMemo(() => {
    if (zoomLevel !== 'day') return [];
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.map((day) => {
      const x = dateToXDynamic(day, startDate, pixelsPerDay);
      return {
        date: day,
        label: format(day, 'd'),
        dayName: format(day, 'EEE'),
        x,
        width: pixelsPerDay,
        isWeekend: day.getDay() === 0 || day.getDay() === 6
      };
    });
  }, [startDate, endDate, pixelsPerDay, zoomLevel]);

  const headerHeight = zoomLevel === 'day' ? 80 : 70;
  
  // Minimum width to show week number label
  const MIN_WEEK_WIDTH_FOR_LABEL = 20;

  return (
    <div 
      className="sticky top-0 z-20 select-none flex-shrink-0"
      style={{ height: headerHeight, width }}
    >
      {/* Month Row - Primary Header */}
      <div 
        className="relative h-9 overflow-hidden"
        style={{ backgroundColor: theme.headerBackground }}
      >
        {monthIntervals.map((month, index) => (
          <div
            key={index}
            className="absolute top-0 h-full flex items-center justify-center border-r overflow-hidden"
            style={{ 
              left: month.x,
              width: month.width,
              borderColor: 'rgba(255,255,255,0.2)'
            }}
          >
            {month.width > 30 && (
              <span 
                className="text-sm font-semibold tracking-wide uppercase truncate px-2"
                style={{ color: theme.headerText }}
                title={month.fullLabel}
              >
                {month.width > 100 ? month.fullLabel : month.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Week/Day Row - Secondary Header */}
      <div 
        className="relative overflow-hidden border-b border-slate-300"
        style={{ 
          backgroundColor: theme.weekRowBackground,
          height: zoomLevel === 'day' ? 46 : 31
        }}
      >
        {zoomLevel === 'day' ? (
          // Day view - show individual days
          dayIntervals.map((day, index) => (
            <div
              key={index}
              className={`absolute top-0 h-full flex flex-col items-center justify-center border-r border-slate-200 overflow-hidden ${
                day.isWeekend ? 'bg-slate-100' : ''
              }`}
              style={{ 
                left: day.x,
                width: day.width
              }}
            >
              {day.width > 15 && (
                <>
                  <span 
                    className="text-xs font-medium"
                    style={{ color: theme.weekRowText }}
                  >
                    {day.label}
                  </span>
                  {day.width > 25 && (
                    <span 
                      className="text-[10px] opacity-70"
                      style={{ color: theme.weekRowText }}
                    >
                      {day.dayName}
                    </span>
                  )}
                </>
              )}
            </div>
          ))
        ) : (
          // Week/Month/Quarter view - show week numbers
          weekIntervals.map((week, index) => (
            <div
              key={index}
              className="absolute top-0 h-full flex items-center justify-center border-r border-slate-200 overflow-hidden"
              style={{ 
                left: week.x,
                width: week.width
              }}
            >
              {week.width >= MIN_WEEK_WIDTH_FOR_LABEL && (
                <span 
                  className="text-xs font-medium truncate"
                  style={{ color: theme.weekRowText }}
                >
                  {week.width > 30 ? `W${week.weekNumber}` : week.weekNumber}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Zoom level indicator */}
      <div 
        className="absolute top-1 right-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.9)',
          color: theme.headerBackground
        }}
      >
        {zoomLevel}
      </div>
    </div>
  );
}
