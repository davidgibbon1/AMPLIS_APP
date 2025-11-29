'use client';

import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: project, isLoading, refetch } = trpc.project.getWithHealth.useQuery({ id: params.id });
  
  // Simple mutation wrappers
  const createDeliverable = trpc.deliverable.create.useMutation({ onSuccess: () => refetch() });
  const logTime = trpc.timesheet.log.useMutation({ onSuccess: () => refetch() });
  const updateProgress = trpc.deliverable.updateProgress.useMutation({ onSuccess: () => refetch() });

  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
  const [logTimeData, setLogTimeData] = useState({ deliverableId: '', hours: 0, notes: '' });

  if (isLoading) return <div>Loading project...</div>;
  if (!project) return <div>Project not found</div>;

  const { health } = project;

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    await logTime.mutateAsync({
      projectId: project.id,
      deliverableId: logTimeData.deliverableId || undefined,
      personId: 'user_mock_1', // In real app, current user
      date: new Date(),
      hours: Number(logTimeData.hours),
      notes: logTimeData.notes
    });
    setIsLogTimeOpen(false);
    setLogTimeData({ deliverableId: '', hours: 0, notes: '' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {project.name}
            <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border">
              {project.status}
            </span>
          </h2>
          <p className="text-muted-foreground mt-1">{project.clientName} • {project.currency}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsLogTimeOpen(!isLogTimeOpen)}>
            Log Time
          </Button>
          <Button variant="outline" onClick={() => window.location.href = `/projects/${project.id}/gantt`}>
            Gantt View
          </Button>
          <Button>Edit Project</Button>
        </div>
      </div>

      {/* Log Time Dialog (Inline for MVP) */}
      {isLogTimeOpen && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <form onSubmit={handleLogTime} className="flex gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <label className="text-sm font-medium">Deliverable</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={logTimeData.deliverableId}
                  onChange={(e) => setLogTimeData({...logTimeData, deliverableId: e.target.value})}
                >
                  <option value="">General / No Deliverable</option>
                  {project.deliverables.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 w-24">
                <label className="text-sm font-medium">Hours</label>
                <input 
                  type="number" step="0.5"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={logTimeData.hours}
                  onChange={(e) => setLogTimeData({...logTimeData, hours: Number(e.target.value)})}
                  required
                />
              </div>
              <div className="grid gap-2 flex-1">
                <label className="text-sm font-medium">Notes</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={logTimeData.notes}
                  onChange={(e) => setLogTimeData({...logTimeData, notes: e.target.value})}
                />
              </div>
              <Button type="submit" disabled={logTime.isLoading}>Save Log</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Health Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${health.totalPrice.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Fixed: ${project.priceTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cost & Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${health.currentMarginAmount.toLocaleString()}</div>
            <div className="flex items-center text-xs">
              <span className={health.currentMarginPct < project.targetMarginPct ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                {health.currentMarginPct.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">
                (Target: {project.targetMarginPct}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Effort (Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.totalActualHours.toFixed(1)} <span className="text-sm text-muted-foreground font-normal">/ {health.totalBudgetHours}</span></div>
            <div className="w-full bg-secondary mt-2 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-slate-900 h-full" 
                style={{ width: `${Math.min((health.totalActualHours / (health.totalBudgetHours || 1)) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={health.riskLevel === 'HIGH' ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.riskScore}</div>
            <p className="text-xs font-medium text-muted-foreground">{health.riskLevel} RISK</p>
          </CardContent>
        </Card>
      </div>

      {/* Deliverables */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Deliverables</h3>
          <Button variant="outline" size="sm" onClick={() => {
            const name = prompt("Deliverable Name:");
            if (name) createDeliverable.mutate({ 
              projectId: project.id, 
              data: { name, priceTotal: 5000, budgetHours: 40 } 
            });
          }}>+ Add Deliverable</Button>
        </div>
        <div className="border rounded-lg bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Progress</th>
                <th className="px-4 py-3 text-right font-medium">Hours</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {project.deliverables.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3">
                    <select 
                      className="bg-transparent border-none text-xs font-medium text-slate-600 cursor-pointer"
                      value={d.status}
                      onChange={(e) => updateProgress.mutate({ id: d.id, percentComplete: d.percentComplete, status: e.target.value })}
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="UNDER_REVIEW">Review</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${d.percentComplete}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{d.percentComplete}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {d.actualHours.toFixed(1)} / {d.budgetHours}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${d.priceTotal.toLocaleString()}
                  </td>
                </tr>
              ))}
              {project.deliverables.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No deliverables. Add one to start tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
