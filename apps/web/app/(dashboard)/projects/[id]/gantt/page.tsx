'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { GanttCanvas } from '@/components/gantt/GanttCanvas';
import { GanttToolbar } from '@/components/gantt/GanttToolbar';
import { ResourcePanel } from '@/components/gantt/ResourcePanel';
import { ThemePanel } from '@/components/gantt/ThemePanel';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GanttPage({ params }: { params: { id: string } }) {
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Fetch full Gantt view
  const { data, isLoading, error, refetch } = trpc.gantt.getFullView.useQuery({
    projectId: params.id
  });
  
  // Get org context (simplified - would come from auth context)
  const { data: orgData } = trpc.org.list.useQuery();
  const orgId = orgData?.[0]?.id || '';
  
  const handleExport = () => {
    // Trigger export functionality
    alert('Export functionality coming soon!');
  };
  
  const handleUpdate = () => {
    refetch();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Gantt chart...</p>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load Gantt chart</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <div className="h-14 border-b bg-white flex items-center px-6 gap-4">
        <Link href={`/projects/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Project
          </Button>
        </Link>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setShowTaskModal(true)}>
          <Plus size={16} className="mr-1" />
          New Task
        </Button>
      </div>
      
      {/* Toolbar */}
      <GanttToolbar
        projectName={data.project.name}
        onOpenThemePanel={() => setShowThemePanel(true)}
        onOpenResourcePanel={() => setShowResourcePanel(true)}
        onExport={handleExport}
      />
      
      {/* Main Canvas */}
      <div className="flex-1 overflow-hidden">
        <GanttCanvas
          projectId={params.id}
          data={data}
          onTaskUpdate={handleUpdate}
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
        />
      )}
      
      {/* Quick Stats Footer (optional) */}
      <div className="h-10 border-t bg-slate-50 flex items-center px-6 text-xs text-slate-600">
        <div className="flex gap-6">
          <span>
            <strong>{data.deliverables.length}</strong> deliverables
          </span>
          <span>
            <strong>{data.deliverables.reduce((sum, d) => sum + d.tasks.length, 0)}</strong> tasks
          </span>
          <span>
            <strong>
              {data.deliverables.reduce((sum, d) => 
                sum + d.tasks.filter(t => t.status === 'COMPLETED').length, 0
              )}
            </strong> completed
          </span>
          <span className="ml-auto">
            Press <kbd className="px-1 py-0.5 bg-slate-200 rounded">Shift</kbd> + drag to multi-select
          </span>
        </div>
      </div>
    </div>
  );
}





