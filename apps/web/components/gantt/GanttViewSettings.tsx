'use client';

import { useState } from 'react';
import { useGanttStore } from '@/lib/gantt/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X, Calendar, Grid3x3, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface GanttViewSettingsProps {
  onClose: () => void;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
}

export function GanttViewSettings({ 
  onClose, 
  projectStartDate, 
  projectEndDate 
}: GanttViewSettingsProps) {
  const {
    timelineStart,
    timelineEnd,
    customDateRange,
    setTimelineRange,
    setCustomDateRange,
    showGridLines,
    setShowGridLines,
    showDateTicks,
    setShowDateTicks,
    gridInterval,
    setGridInterval,
  } = useGanttStore();
  
  const [localStart, setLocalStart] = useState(format(timelineStart, 'yyyy-MM-dd'));
  const [localEnd, setLocalEnd] = useState(format(timelineEnd, 'yyyy-MM-dd'));
  
  const handleApplyDates = () => {
    const start = new Date(localStart);
    const end = new Date(localEnd);
    
    if (start < end) {
      setTimelineRange(start, end);
      setCustomDateRange(true);
    } else {
      alert('Start date must be before end date');
    }
  };
  
  const handleResetToProject = () => {
    if (projectStartDate && projectEndDate) {
      const start = new Date(projectStartDate);
      start.setDate(start.getDate() - 14); // 2 weeks before
      
      const end = new Date(projectEndDate);
      end.setDate(end.getDate() + 14); // 2 weeks after
      
      setTimelineRange(start, end);
      setLocalStart(format(start, 'yyyy-MM-dd'));
      setLocalEnd(format(end, 'yyyy-MM-dd'));
      setCustomDateRange(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Gantt View Settings</h2>
            <p className="text-sm text-slate-500 mt-1">Customize timeline and grid display</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        
        {/* Date Range Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-slate-600" />
            <h3 className="font-semibold text-slate-900">Timeline Date Range</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-sm font-medium">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="end-date" className="text-sm font-medium">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleApplyDates} size="sm">
              Apply Custom Range
            </Button>
            <Button 
              onClick={handleResetToProject} 
              variant="outline" 
              size="sm"
              disabled={!projectStartDate || !projectEndDate}
            >
              Reset to Project Dates
            </Button>
          </div>
          
          {customDateRange && (
            <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded">
              ℹ️ Using custom date range
            </div>
          )}
        </div>
        
        <div className="border-t border-slate-200 my-6" />
        
        {/* Grid Settings Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Grid3x3 size={18} className="text-slate-600" />
            <h3 className="font-semibold text-slate-900">Grid Settings</h3>
          </div>
          
          {/* Grid Interval */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Vertical Grid Interval
            </Label>
            <div className="flex gap-2">
              <Button
                variant={gridInterval === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGridInterval('day')}
              >
                Daily
              </Button>
              <Button
                variant={gridInterval === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGridInterval('week')}
              >
                Weekly
              </Button>
              <Button
                variant={gridInterval === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGridInterval('month')}
              >
                Monthly
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Controls the spacing of vertical grid lines
            </p>
          </div>
          
          {/* Toggle Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                {showGridLines ? <Eye size={16} /> : <EyeOff size={16} />}
                <div>
                  <Label className="text-sm font-medium">Show Grid Lines</Label>
                  <p className="text-xs text-slate-500">Display vertical grid lines</p>
                </div>
              </div>
              <button
                onClick={() => setShowGridLines(!showGridLines)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${showGridLines ? 'bg-blue-600' : 'bg-slate-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${showGridLines ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                {showDateTicks ? <Eye size={16} /> : <EyeOff size={16} />}
                <div>
                  <Label className="text-sm font-medium">Show Date Ticks</Label>
                  <p className="text-xs text-slate-500">Display date markers on grid</p>
                </div>
              </div>
              <button
                onClick={() => setShowDateTicks(!showDateTicks)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${showDateTicks ? 'bg-blue-600' : 'bg-slate-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${showDateTicks ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-200 my-6" />
        
        {/* Info Section */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Tips</h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Set a wider date range to see more context around your tasks</li>
            <li>• Use grid intervals that match your zoom level for clarity</li>
            <li>• Hide grid lines for a cleaner view when presenting</li>
            <li>• Date ticks help identify specific dates at a glance</li>
          </ul>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}


