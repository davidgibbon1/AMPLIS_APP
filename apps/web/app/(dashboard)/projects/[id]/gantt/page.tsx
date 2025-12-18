'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { GanttCanvas } from '@/components/gantt/GanttCanvas';
import { GanttToolbar } from '@/components/gantt/GanttToolbar';
import { ResourcePanel } from '@/components/gantt/ResourcePanel';
import { ThemePanel } from '@/components/gantt/ThemePanel';
import { HighlightPanel } from '@/components/gantt/HighlightPanel';
import { ExportModal } from '@/components/gantt/ExportModal';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { THEME_PRESETS } from '@/lib/gantt/themes';

export default function GanttPage({ params }: { params: { id: string } }) {
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showHighlightPanel, setShowHighlightPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [themePreset, setThemePreset] = useState('corporate');
  
  // Fetch full Gantt view
  const { data, isLoading, error, refetch } = trpc.gantt.getFullView.useQuery({
    projectId: params.id
  });
  
  // Get org context (simplified - would come from auth context)
  const { data: orgData } = trpc.org.list.useQuery();
  const orgId = orgData?.[0]?.id || '';
  
  const handleExport = () => {
    setShowExportModal(true);
  };
  
  const handleUpdate = () => {
    refetch();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Gantt chart...</p>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <p className="text-red-600 mb-4">Failed to load Gantt chart</p>
          <p className="text-sm text-slate-500 mb-4">{error?.message}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }
  
  // Ensure highlights array exists (for backward compatibility)
  const dataWithHighlights = {
    ...data,
    highlights: data.highlights || []
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <div className="h-12 border-b bg-white flex items-center px-4 gap-3">
        <Link href={`/projects/${params.id}`}>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
        </Link>
        
        <div className="w-px h-6 bg-slate-200" />
        
        {/* Quick theme selector */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors">
            <div className="flex gap-0.5">
              {THEME_PRESETS[themePreset]?.categoryColors.slice(0, 3).map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="capitalize">{themePreset}</span>
            <ChevronDown size={14} />
          </button>
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
            {Object.entries(THEME_PRESETS).map(([name, preset]) => (
              <button
                key={name}
                onClick={() => setThemePreset(name)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  themePreset === name ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                }`}
              >
                <div className="flex gap-0.5">
                  {preset.categoryColors.slice(0, 3).map((c, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="capitalize">{name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1" />
        
        <Button size="sm" className="h-8" onClick={() => setShowTaskModal(true)}>
          <Plus size={16} className="mr-1" />
          New Task
        </Button>
      </div>
      
      {/* Toolbar */}
      <GanttToolbar
        projectName={data.project.name}
        onOpenThemePanel={() => setShowThemePanel(true)}
        onOpenResourcePanel={() => setShowResourcePanel(true)}
        onOpenHighlightPanel={() => setShowHighlightPanel(true)}
        onExport={handleExport}
      />
      
      {/* Main Canvas */}
      <div className="flex-1 overflow-hidden">
        <GanttCanvas
          projectId={params.id}
          data={dataWithHighlights}
          onTaskUpdate={handleUpdate}
          themePreset={themePreset}
        />
      </div>
      
      {/* Side Panels */}
      {showResourcePanel && (
        <ResourcePanel
          orgId={orgId}
          projectId={params.id}
          onClose={() => setShowResourcePanel(false)}
        />
      )}
      
      {showThemePanel && (
        <ThemePanel
          projectId={params.id}
          currentTheme={data.theme}
          onClose={() => setShowThemePanel(false)}
          onUpdate={handleUpdate}
          selectedPreset={themePreset}
          onPresetChange={setThemePreset}
        />
      )}
      
      {showHighlightPanel && (
        <HighlightPanel
          projectId={params.id}
          highlights={dataWithHighlights.highlights}
          onClose={() => setShowHighlightPanel(false)}
          onUpdate={handleUpdate}
        />
      )}
      
      {showExportModal && (
        <ExportModal
          projectId={params.id}
          projectName={data.project.name}
          onClose={() => setShowExportModal(false)}
        />
      )}
      
      {/* Quick Stats Footer */}
      <div className="h-9 border-t bg-slate-50 flex items-center px-4 text-xs text-slate-500">
        <div className="flex gap-4">
          <span>
            <strong className="text-slate-700">{data.deliverables.length}</strong> deliverables
          </span>
          <span>
            <strong className="text-slate-700">{data.deliverables.reduce((sum, d) => sum + d.tasks.length, 0)}</strong> tasks
          </span>
          <span>
            <strong className="text-slate-700">
              {data.deliverables.reduce((sum, d) => 
                sum + d.tasks.filter(t => t.status === 'COMPLETED').length, 0
              )}
            </strong> completed
          </span>
          {dataWithHighlights.highlights.length > 0 && (
            <span>
              <strong className="text-slate-700">{dataWithHighlights.highlights.length}</strong> highlights
            </span>
          )}
        </div>
        <div className="ml-auto flex gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">Shift</kbd> + drag to multi-select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">Scroll</kbd> to pan timeline
          </span>
        </div>
      </div>
    </div>
  );
}
