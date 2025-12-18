'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface NewTaskModalProps {
  projectId: string;
  deliverables: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTaskModal({ projectId, deliverables, onClose, onSuccess }: NewTaskModalProps) {
  const [deliverableId, setDeliverableId] = useState(deliverables[0]?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [estimatedHours, setEstimatedHours] = useState('8');

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error) => {
      alert(`Failed to create task: ${error.message}`);
    }
  });

  // If no deliverables, show helpful message
  if (deliverables.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">No Deliverables Found</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <p className="text-slate-600 mb-4">
            This project doesn't have any deliverables yet. Tasks must be associated with a deliverable.
          </p>
          
          <p className="text-slate-600 mb-6">
            Please create a deliverable first (e.g., "Phase 1", "General Work", "Development") from the project page, then you can add tasks to it.
          </p>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Got it
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deliverableId) {
      alert('Please select a deliverable');
      return;
    }

    createTask.mutate({
      deliverableId,
      projectId,
      name,
      description: description || undefined,
      status: 'NOT_STARTED',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      estimatedHours: parseFloat(estimatedHours),
      colour: undefined,
      sortOrder: 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="deliverable">Deliverable *</Label>
            <select
              id="deliverable"
              value={deliverableId}
              onChange={(e) => setDeliverableId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {deliverables.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="name">Task Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estimatedHours">Estimated Hours *</Label>
            <Input
              id="estimatedHours"
              type="number"
              step="0.5"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

