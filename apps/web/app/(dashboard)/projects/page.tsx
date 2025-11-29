'use client';

import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: rawData, isLoading, error, refetch } = trpc.project.list.useQuery({ search });
  
  // Handle tRPC batching format: data might be {json: [...], meta: {...}} or just [...]
  const projects = rawData && typeof rawData === 'object' && 'json' in rawData 
    ? rawData.json 
    : rawData;
  
  // Enhanced debug logging
  console.log('=== PROJECT PAGE DEBUG ===');
  console.log('Raw data:', rawData);
  console.log('Projects (processed):', projects);
  console.log('Projects isArray:', Array.isArray(projects));
  console.log('Projects length:', Array.isArray(projects) ? projects.length : 'N/A');
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
  console.log('========================');
  
  const createProject = trpc.project.create.useMutation({
    onSuccess: (rawData) => {
      console.log('✅ Create mutation success, raw data:', rawData);
      // Unwrap tRPC batching format if present
      const data = rawData && typeof rawData === 'object' && 'json' in rawData 
        ? rawData.json 
        : rawData;
      console.log('✅ Unwrapped data:', data);
      toast.success(`Project "${data.name}" created successfully!`);
      setShowCreate(false);
      setNewProjectName('');
      setNewClientName('');
      refetch();
    },
    onError: (error) => {
      console.error('❌ Create mutation error:', error);
      toast.error(`Failed to create project: ${error.message}`);
    },
  });

  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      name: newProjectName,
      clientName: newClientName || undefined,
      status: 'SCOPING' as const,
      deliverables: [],
    };
    
    console.log('🚀 Sending project create request:', projectData);
    createProject.mutate(projectData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your engineering projects and deliverables.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {showCreate && (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <label className="text-sm font-medium">Project Name</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q3 Audit"
                  required
                />
              </div>
              <div className="grid gap-2 flex-1">
                <label className="text-sm font-medium">Client</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <Button type="submit" disabled={createProject.isLoading}>
                {createProject.isLoading ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <input 
          className="flex h-10 w-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-red-600 p-4 border border-red-300 rounded-lg bg-red-50">
          <p className="font-semibold">Error loading projects:</p>
          <p className="text-sm">{error.message}</p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer">Debug info</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">{JSON.stringify(error, null, 2)}</pre>
          </details>
        </div>
      ) : !projects ? (
        <div className="p-8 text-center border border-yellow-300 rounded-lg bg-yellow-50">
          <p className="font-semibold text-yellow-800">No data returned</p>
          <p className="text-sm text-yellow-700">Projects data is null or undefined</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Project</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
                <th className="px-4 py-3 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(projects) && projects.map((project) => (
                <tr key={project.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/projects/${project.id}`} className="hover:underline text-blue-600">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{project.clientName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                      ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        project.status === 'SCOPING' ? 'bg-blue-100 text-blue-800' : 
                        'bg-slate-100 text-slate-800'}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    ${project.priceTotal.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {project.targetMarginPct}%
                  </td>
                </tr>
              ))}
              {Array.isArray(projects) && projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No projects found. Click "New Project" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
