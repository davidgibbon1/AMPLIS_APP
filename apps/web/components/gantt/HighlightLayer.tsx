'use client';

import { useMemo } from 'react';
import { GanttHighlight } from '@/lib/gantt/types';
import { dateToXDynamic, calculateBarWidthDynamic } from '@/lib/gantt/utils';

interface HighlightLayerProps {
  highlights: GanttHighlight[];
  startDate: Date;
  pixelsPerDay: number;
  totalHeight: number;
  headerHeight?: number;
}

export function HighlightLayer({ 
  highlights, 
  startDate, 
  pixelsPerDay, 
  totalHeight,
  headerHeight = 0
}: HighlightLayerProps) {
  
  const renderedHighlights = useMemo(() => {
    return highlights.map((highlight) => {
      const x = dateToXDynamic(highlight.startDate, startDate, pixelsPerDay);
      const width = calculateBarWidthDynamic(highlight.startDate, highlight.endDate, pixelsPerDay);
      
      return {
        ...highlight,
        x: Math.max(x, 0),
        width
      };
    });
  }, [highlights, startDate, pixelsPerDay]);

  if (highlights.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ top: headerHeight }}>
      {renderedHighlights.map((highlight) => (
        <div key={highlight.id} className="absolute top-0" style={{ height: totalHeight }}>
          {/* Highlight background */}
          <div
            className="absolute inset-y-0 transition-colors"
            style={{
              left: highlight.x,
              width: highlight.width,
              backgroundColor: highlight.colour,
              opacity: highlight.opacity / 100,
            }}
          />
          
          {/* Highlight borders (left and right) */}
          <div
            className="absolute inset-y-0 w-px"
            style={{
              left: highlight.x,
              backgroundColor: highlight.colour,
              opacity: Math.min((highlight.opacity / 100) + 0.3, 1),
            }}
          />
          <div
            className="absolute inset-y-0 w-px"
            style={{
              left: highlight.x + highlight.width,
              backgroundColor: highlight.colour,
              opacity: Math.min((highlight.opacity / 100) + 0.3, 1),
            }}
          />
          
          {/* Label */}
          {highlight.showLabel && highlight.width >= 40 && (
            <div
              className={`absolute flex items-center justify-center ${
                highlight.labelPosition === 'top' ? 'top-2' : 'bottom-2'
              }`}
              style={{
                left: highlight.x,
                width: highlight.width,
              }}
            >
              <span 
                className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded whitespace-nowrap truncate max-w-full"
                style={{
                  backgroundColor: highlight.colour,
                  color: getContrastColor(highlight.colour),
                  opacity: Math.min((highlight.opacity / 100) + 0.5, 1),
                }}
              >
                {highlight.name}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper to get contrasting text color
function getContrastColor(hexcolor: string): string {
  const hex = hexcolor.replace('#', '');
  if (hex.length !== 6) return '#000000';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#ffffff';
}

