'use client';

import { useState } from 'react';
import { ZoomLevel } from '@/lib/gantt/types';
import { useGanttStore } from '@/lib/gantt/store';
import { Button } from '@/components/ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Calendar, 
  Filter,
  Download,
  Users,
  GitBranch,
  Palette,
  CalendarRange,
  CalendarDays,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface GanttToolbarProps {
  projectName: string;
  onOpenThemePanel: () => void;
  onOpenResourcePanel: () => void;
  onOpenHighlightPanel: () => void;
  onExport: () => void;
}

export function GanttToolbar({ 
  projectName, 
  onOpenThemePanel, 
  onOpenResourcePanel,
  onOpenHighlightPanel,
  onExport
}: GanttToolbarProps) {
  const {
    zoomLevel,
    setZoomLevel,
    snapToGrid,
    setSnapToGrid,
    showDependencies,
    setShowDependencies,
    timelineStart,
    timelineEnd,
    customTimelineStart,
    customTimelineEnd,
    setCustomTimelineRange
  } = useGanttStore();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  
  const zoomLevels: ZoomLevel[] = ['day', 'week', 'month', 'quarter'];
  const currentZoomIndex = zoomLevels.indexOf(zoomLevel);
  
  const handleZoomIn = () => {
    if (currentZoomIndex > 0) {
      setZoomLevel(zoomLevels[currentZoomIndex - 1]);
    }
  };
  
  const handleZoomOut = () => {
    if (currentZoomIndex < zoomLevels.length - 1) {
      setZoomLevel(zoomLevels[currentZoomIndex + 1]);
    }
  };
  
  const handleOpenDatePicker = () => {
    setTempStartDate(customTimelineStart 
      ? format(customTimelineStart, 'yyyy-MM-dd')
      : format(timelineStart, 'yyyy-MM-dd')
    );
    setTempEndDate(customTimelineEnd 
      ? format(customTimelineEnd, 'yyyy-MM-dd')
      : format(timelineEnd, 'yyyy-MM-dd')
    );
    setShowDatePicker(true);
  };
  
  const handleApplyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setCustomTimelineRange(
        new Date(tempStartDate),
        new Date(tempEndDate)
      );
    }
    setShowDatePicker(false);
  };
  
  const handleResetDateRange = () => {
    setCustomTimelineRange(null, null);
    setShowDatePicker(false);
  };
  
  const hasCustomRange = customTimelineStart !== null || customTimelineEnd !== null;
  
  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-6 relative">
      {/* Left: Project name */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {projectName}
        </h2>
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
          <Calendar size={14} />
          <span>Gantt View</span>
        </div>
      </div>
      
      {/* Center: Zoom controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={currentZoomIndex === zoomLevels.length - 1}
        >
          <ZoomOut size={16} />
        </Button>
        
        <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded">
          {zoomLevels.map((level) => (
            <button
              key={level}
              onClick={() => setZoomLevel(level)}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-colors
                ${zoomLevel === level ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}
              `}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={currentZoomIndex === 0}
        >
          <ZoomIn size={16} />
        </Button>
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Date Range Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDatePicker}
          className={hasCustomRange ? 'bg-blue-50 border-blue-300' : ''}
        >
          <CalendarDays size={16} className="mr-1" />
          {hasCustomRange ? 'Custom Range' : 'Date Range'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={snapToGrid ? 'bg-blue-50 border-blue-300' : ''}
        >
          <Filter size={16} className="mr-1" />
          Snap to Grid
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDependencies(!showDependencies)}
          className={showDependencies ? 'bg-blue-50 border-blue-300' : ''}
        >
          <GitBranch size={16} className="mr-1" />
          Dependencies
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenResourcePanel}
        >
          <Users size={16} className="mr-1" />
          Resources
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenHighlightPanel}
        >
          <CalendarRange size={16} className="mr-1" />
          Breaks
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenThemePanel}
        >
          <Palette size={16} className="mr-1" />
          Theme
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
        >
          <Download size={16} className="mr-1" />
          Export
        </Button>
      </div>
      
      {/* Date Range Picker Popover */}
      {showDatePicker && (
        <div className="absolute top-full right-6 mt-2 z-50 bg-white rounded-lg shadow-xl border p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">Timeline Range</h4>
            <button
              onClick={() => setShowDatePicker(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDateRange}
                className="flex-1"
              >
                Reset to Default
              </Button>
              <Button
                size="sm"
                onClick={handleApplyDateRange}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
