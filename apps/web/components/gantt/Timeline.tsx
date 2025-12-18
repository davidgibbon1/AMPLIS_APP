'use client';

import { generateTimelineIntervals, HEADER_HEIGHT } from '@/lib/gantt/utils';
import { ZoomLevel } from '@/lib/gantt/types';
import { format } from 'date-fns';

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoomLevel: ZoomLevel;
  width: number;
}

export function Timeline({ startDate, endDate, zoomLevel, width }: TimelineProps) {
  const intervals = generateTimelineIntervals(startDate, endDate, zoomLevel);
  
  return (
    <div 
      className="sticky top-0 z-20 bg-white border-b border-slate-200"
      style={{ height: HEADER_HEIGHT }}
    >
      {/* Today indicator line */}
      <div className="relative h-full">
        {intervals.map((interval, index) => {
          const isToday = format(new Date(), 'yyyy-MM-dd') === format(interval.date, 'yyyy-MM-dd');
          
          return (
            <div
              key={index}
              className="absolute top-0 h-full border-l border-slate-200"
              style={{
                left: interval.x,
                minWidth: index === intervals.length - 1 ? 'auto' : undefined,
              }}
            >
              <div className="px-3 py-2">
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                  {interval.label}
                </div>
                {zoomLevel === 'day' && (
                  <div className="text-xs text-slate-500">
                    {format(interval.date, 'EEE')}
                  </div>
                )}
              </div>
              {isToday && (
                <div className="absolute top-0 left-0 w-0.5 h-full bg-blue-500 z-10" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Zoom level indicator */}
      <div className="absolute top-2 right-4 text-xs text-slate-500 uppercase tracking-wider">
        {zoomLevel} View
      </div>
    </div>
  );
}





