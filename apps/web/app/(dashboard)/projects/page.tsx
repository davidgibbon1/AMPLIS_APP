'use client';

import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects, isLoading, error, refetch } = trpc.project.list.useQuery({ search });
  
  // Debug logging
  console.log('Projects data:', projects);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
  
  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      refetch();
    },
  });

  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate({
      name: newProjectName,
      clientName: newClientName || undefined,
      status: 'SCOPING',
      deliverables: [],
    });
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
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600 p-4 border border-red-300 rounded-lg bg-red-50">
          <p className="font-semibold">Error loading projects:</p>
          <p className="text-sm">{error.message}</p>
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
                    No projects found.
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
