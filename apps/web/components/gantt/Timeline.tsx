'use client';

import { 
  HEADER_HEIGHT,
  dateToXDynamic
} from '@/lib/gantt/utils';
import { ZoomLevel } from '@/lib/gantt/types';
import { format, eachMonthOfInterval, eachWeekOfInterval, startOfMonth, isToday } from 'date-fns';

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoomLevel: ZoomLevel;
  width: number;
  pixelsPerDay: number;
}

export function Timeline({ startDate, endDate, zoomLevel, width, pixelsPerDay }: TimelineProps) {
  // Generate intervals based on zoom level but position with pixelsPerDay
  const generateIntervals = () => {
    const intervals: Array<{ date: Date; label: string; x: number }> = [];
    
    // Show months as primary divisions
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    months.forEach((month) => {
      const x = dateToXDynamic(month, startDate, pixelsPerDay);
      intervals.push({
        date: month,
        label: format(month, 'MMM yyyy'),
        x
      });
    });
    
    return intervals;
  };
  
  const intervals = generateIntervals();
  
  return (
    <div 
      className="sticky top-0 z-20 bg-white border-b border-slate-200"
      style={{ height: HEADER_HEIGHT, width }}
    >
      <div className="relative h-full overflow-hidden">
        {/* Month/Week markers */}
        {intervals.map((interval, index) => {
          const isTodayDate = isToday(interval.date);
          
          return (
            <div
              key={index}
              className="absolute top-0 h-full border-l border-slate-200"
              style={{ left: interval.x }}
            >
              <div className="px-2 py-2">
                <div className={`text-sm font-medium whitespace-nowrap ${isTodayDate ? 'text-red-600' : 'text-slate-700'}`}>
                  {interval.label}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Today indicator removed from header - only shows in canvas area */}
      </div>
      
      {/* Zoom level indicator */}
      <div className="absolute top-2 right-4 text-xs text-slate-500 uppercase tracking-wider bg-white/80 px-2 py-1 rounded">
        {zoomLevel} View
      </div>
    </div>
  );
}





