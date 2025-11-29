'use client'

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Network, 
  List,
  Building2,
  UserCircle,
  Mail,
  DollarSign,
  Edit2,
  Trash2,
  Settings,
} from 'lucide-react';

interface Person {
  id: string;
  name: string;
  email: string | null;
  orgLevel: { id: string; name: string; order: number } | null;
  manager: { id: string; name: string } | null;
  reports: Array<{
    id: string;
    name: string;
    email: string | null;
    orgLevel: { name: string } | null;
  }>;
  _count: { reports: number };
  defaultRate: number;
  billRate: number;
}

export default function PeoplePage() {
  const [viewMode, setViewMode] = useState<'hierarchy' | 'list'>('hierarchy');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddLevel, setShowAddLevel] = useState(false);

  const { data: people = [], isLoading: loadingPeople, refetch: refetchPeople } = trpc.org.listPeople.useQuery();
  const { data: hierarchy = [], isLoading: loadingHierarchy, refetch: refetchHierarchy } = trpc.org.getOrgHierarchy.useQuery();
  const { data: orgLevels = [], isLoading: loadingLevels, refetch: refetchLevels } = trpc.org.listOrgLevels.useQuery();

  const filteredPeople = people.filter((person: Person) => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || person.orgLevel?.id === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const isLoading = loadingPeople || loadingHierarchy || loadingLevels;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">People & Organization</h1>
          <p className="text-slate-600 mt-1">
            Manage your organization structure, levels, and reporting hierarchy
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAddLevel(true)}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Manage Levels
          </Button>
          <Button onClick={() => setShowAddPerson(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total People</p>
                <p className="text-2xl font-bold text-slate-900">{people.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Org Levels</p>
                <p className="text-2xl font-bold text-slate-900">{orgLevels.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Managers</p>
                <p className="text-2xl font-bold text-slate-900">
                  {people.filter((p: Person) => p._count.reports > 0).length}
                </p>
              </div>
              <Network className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Unassigned</p>
                <p className="text-2xl font-bold text-slate-900">
                  {people.filter((p: Person) => !p.orgLevel).length}
                </p>
              </div>
              <UserCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <Label htmlFor="level">Filter by Level</Label>
              <select
                id="level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                {orgLevels.map((level: any) => (
                  <option key={level.id} value={level.id}>
                    {level.name} ({level._count.people})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
                onClick={() => setViewMode('hierarchy')}
              >
                <Network className="w-4 h-4 mr-2" />
                Hierarchy
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-600">Loading organization data...</p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'hierarchy' ? (
        <HierarchyView 
          hierarchy={hierarchy} 
          onRefetch={() => {
            refetchPeople();
            refetchHierarchy();
          }}
        />
      ) : (
        <ListView 
          people={filteredPeople} 
          onRefetch={refetchPeople}
        />
      )}

      {/* Modals */}
      {showAddPerson && (
        <AddPersonModal
          orgLevels={orgLevels}
          people={people}
          onClose={() => setShowAddPerson(false)}
          onSuccess={() => {
            setShowAddPerson(false);
            refetchPeople();
            refetchHierarchy();
          }}
        />
      )}

      {showAddLevel && (
        <ManageLevelsModal
          levels={orgLevels}
          onClose={() => setShowAddLevel(false)}
          onSuccess={() => {
            setShowAddLevel(false);
            refetchLevels();
            refetchPeople();
          }}
        />
      )}
    </div>
  );
}

// Hierarchy View Component
function HierarchyView({ hierarchy, onRefetch }: { hierarchy: any[]; onRefetch: () => void }) {
  if (hierarchy.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Organizational Structure</h3>
            <p className="text-slate-600 mb-4">Start by adding people to your organization</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Hierarchy</CardTitle>
        <CardDescription>Visual representation of your reporting structure</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hierarchy.map((node) => (
            <HierarchyNode key={node.person.id} node={node} level={0} onRefetch={onRefetch} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Hierarchy Node Component (Recursive)
function HierarchyNode({ node, level, onRefetch }: { node: any; level: number; onRefetch: () => void }) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const person = node.person;
  const hasReports = node.reports && node.reports.length > 0;

  return (
    <div className="relative">
      <div 
        className={`flex items-center gap-3 p-4 rounded-lg border ${
          level === 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
        } hover:shadow-md transition-shadow`}
        style={{ marginLeft: `${level * 40}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasReports && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 w-6 h-6 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-100"
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
        
        {!hasReports && <div className="w-6" />}

        {/* Person Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900">{person.name}</span>
            {person.orgLevel && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                {person.orgLevel.name}
              </span>
            )}
          </div>
          {person.email && (
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
              <Mail className="w-3 h-3" />
              {person.email}
            </div>
          )}
        </div>

        {/* Reports Count */}
        {hasReports && (
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>{node.reports.length} report{node.reports.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Reports (Recursive) */}
      {isExpanded && hasReports && (
        <div className="mt-2">
          {node.reports.map((childNode: any) => (
            <HierarchyNode 
              key={childNode.person.id} 
              node={childNode} 
              level={level + 1}
              onRefetch={onRefetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// List View Component
function ListView({ people, onRefetch }: { people: Person[]; onRefetch: () => void }) {
  if (people.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No People Found</h3>
            <p className="text-slate-600">Try adjusting your filters or add a new person</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Level</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Manager</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Reports</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Rates</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{person.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {person.email || '—'}
                  </td>
                  <td className="py-3 px-4">
                    {person.orgLevel ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {person.orgLevel.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {person.manager?.name || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {person._count.reports > 0 ? person._count.reports : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-sm">
                    <div>${person.defaultRate}/hr</div>
                    <div className="text-xs text-slate-500">Bill: ${person.billRate}/hr</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Add Person Modal
function AddPersonModal({ 
  orgLevels, 
  people, 
  onClose, 
  onSuccess 
}: { 
  orgLevels: any[]; 
  people: any[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const createPerson = trpc.org.createPerson.useMutation();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      await createPerson.mutateAsync({
        name: String(formData.get('name')),
        email: formData.get('email') ? String(formData.get('email')) : undefined,
        orgLevelId: formData.get('orgLevelId') ? String(formData.get('orgLevelId')) : undefined,
        managerId: formData.get('managerId') ? String(formData.get('managerId')) : undefined,
        defaultRate: Number(formData.get('defaultRate')) || 0,
        billRate: Number(formData.get('billRate')) || 0,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create person');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add New Person</CardTitle>
          <CardDescription>Add a new person to your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orgLevelId">Organization Level</Label>
                <select
                  id="orgLevelId"
                  name="orgLevelId"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="">None</option>
                  {orgLevels.map((level: any) => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="managerId">Manager</Label>
                <select
                  id="managerId"
                  name="managerId"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="">None</option>
                  {people.map((person: any) => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultRate">Cost Rate ($/hr)</Label>
                <Input id="defaultRate" name="defaultRate" type="number" step="0.01" defaultValue="0" />
              </div>
              
              <div>
                <Label htmlFor="billRate">Bill Rate ($/hr)</Label>
                <Input id="billRate" name="billRate" type="number" step="0.01" defaultValue="0" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Person'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Manage Levels Modal
function ManageLevelsModal({ 
  levels, 
  onClose, 
  onSuccess 
}: { 
  levels: any[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const createLevel = trpc.org.createOrgLevel.useMutation();
  const deleteLevel = trpc.org.deleteOrgLevel.useMutation();

  async function handleAddLevel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      await createLevel.mutateAsync({
        name: String(formData.get('name')),
        description: formData.get('description') ? String(formData.get('description')) : undefined,
        order: Number(formData.get('order')) || 0,
      });
      setShowAddForm(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create level');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLevel(id: string) {
    if (!confirm('Are you sure you want to delete this level? People assigned to this level will be unassigned.')) {
      return;
    }

    try {
      await deleteLevel.mutateAsync({ id });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to delete level');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Manage Organization Levels</CardTitle>
          <CardDescription>
            Create and manage custom organization levels (e.g., Consultant, Senior Consultant)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Existing Levels */}
          <div className="space-y-2">
            {levels.map((level: any) => (
              <div 
                key={level.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div>
                  <div className="font-semibold text-slate-900">{level.name}</div>
                  {level.description && (
                    <div className="text-sm text-slate-600">{level.description}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {level._count.people} people
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteLevel(level.id)}
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Level Form */}
          {showAddForm ? (
            <form onSubmit={handleAddLevel} className="space-y-3 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <div>
                <Label htmlFor="name">Level Name *</Label>
                <Input id="name" name="name" placeholder="e.g., Senior Consultant" required />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Optional description" />
              </div>
              
              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input id="order" name="order" type="number" defaultValue="0" />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Level'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Level
            </Button>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







