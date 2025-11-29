'use client';

import { ZoomLevel } from '@/lib/gantt/types';
import { useGanttStore } from '@/lib/gantt/store';
import { Button } from '@/components/ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Calendar, 
  Filter,
  Settings,
  Download,
  Users,
  GitBranch
} from 'lucide-react';

interface GanttToolbarProps {
  projectName: string;
  onOpenThemePanel: () => void;
  onOpenResourcePanel: () => void;
  onExport: () => void;
}

export function GanttToolbar({ 
  projectName, 
  onOpenThemePanel, 
  onOpenResourcePanel,
  onExport
}: GanttToolbarProps) {
  const {
    zoomLevel,
    setZoomLevel,
    snapToGrid,
    setSnapToGrid,
    showDependencies,
    setShowDependencies,
    showCompletedTasks,
    setShowCompletedTasks
  } = useGanttStore();
  
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
  
  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-6">
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
          onClick={onOpenThemePanel}
        >
          <Settings size={16} className="mr-1" />
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
    </div>
  );
}






