'use client';

import { ROW_HEIGHT } from '@/lib/gantt/utils';

interface CategoryLabelProps {
  name: string;
  colour: string;
  taskCount: number;
  rowStart: number;
  totalRows: number; // Number of rows this category spans (1 header + tasks)
}

// Function to determine if text should be light or dark based on background
function getContrastColor(hexcolor: string): string {
  // Remove # if present
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#ffffff';
}

// Function to darken a color for the border
function darkenColor(hexcolor: string, percent: number): string {
  const hex = hexcolor.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - percent);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - percent);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - percent);
  return `rgb(${r}, ${g}, ${b})`;
}

export function CategoryLabel({ 
  name, 
  colour, 
  taskCount,
  rowStart, 
  totalRows 
}: CategoryLabelProps) {
  const height = totalRows * ROW_HEIGHT;
  const top = rowStart * ROW_HEIGHT;
  const textColor = getContrastColor(colour);
  const borderColor = darkenColor(colour, 40);
  
  // Only show vertical label if there's enough height
  const showVerticalLabel = height >= 60;
  
  return (
    <div
      className="absolute left-0 flex items-center justify-center overflow-hidden transition-all"
      style={{
        top,
        height,
        width: 32,
        backgroundColor: colour,
        borderRight: `2px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      {showVerticalLabel && (
        <div
          className="absolute whitespace-nowrap font-semibold text-xs tracking-wider uppercase"
          style={{
            color: textColor,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            maxHeight: height - 16,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={`${name} (${taskCount} tasks)`}
        >
          {name}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar integration
export function CategoryStrip({ 
  colour, 
  height,
  isHeader = false
}: { 
  colour: string; 
  height: number;
  isHeader?: boolean;
}) {
  const borderColor = darkenColor(colour, 40);
  
  return (
    <div
      className="absolute left-0 top-0 bottom-0 transition-colors"
      style={{
        width: 4,
        backgroundColor: colour,
        borderRight: `1px solid ${borderColor}`,
        opacity: isHeader ? 1 : 0.7,
      }}
    />
  );
}

