'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2, Calendar, Edit2, Check } from 'lucide-react';
import { GanttHighlight } from '@/lib/gantt/types';
import { format } from 'date-fns';

interface HighlightPanelProps {
  projectId: string;
  highlights: GanttHighlight[];
  onClose: () => void;
  onUpdate: () => void;
}

const PRESET_COLORS = [
  { name: 'Gray (Breaks)', color: '#9ca3af' },
  { name: 'Blue (Milestones)', color: '#3b82f6' },
  { name: 'Green (Success)', color: '#22c55e' },
  { name: 'Yellow (Warning)', color: '#eab308' },
  { name: 'Red (Critical)', color: '#ef4444' },
  { name: 'Purple (Phase Gate)', color: '#8b5cf6' },
];

export function HighlightPanel({ projectId, highlights, onClose, onUpdate }: HighlightPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for new/editing highlight
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    colour: '#9ca3af',
    opacity: 30,
    showLabel: true,
    labelPosition: 'bottom' as 'top' | 'bottom'
  });

  const createHighlight = trpc.gantt.createHighlight.useMutation({
    onSuccess: () => {
      onUpdate();
      resetForm();
    }
  });

  const updateHighlight = trpc.gantt.updateHighlight.useMutation({
    onSuccess: () => {
      onUpdate();
      resetForm();
    }
  });

  const deleteHighlight = trpc.gantt.deleteHighlight.useMutation({
    onSuccess: () => {
      onUpdate();
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      colour: '#9ca3af',
      opacity: 30,
      showLabel: true,
      labelPosition: 'bottom'
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const startEditing = (highlight: GanttHighlight) => {
    setEditingId(highlight.id);
    setIsCreating(false);
    setFormData({
      name: highlight.name,
      startDate: format(new Date(highlight.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(highlight.endDate), 'yyyy-MM-dd'),
      colour: highlight.colour,
      opacity: highlight.opacity,
      showLabel: highlight.showLabel,
      labelPosition: highlight.labelPosition
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) return;

    const data = {
      name: formData.name,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      colour: formData.colour,
      opacity: formData.opacity,
      showLabel: formData.showLabel,
      labelPosition: formData.labelPosition
    };

    if (editingId) {
      await updateHighlight.mutateAsync({ id: editingId, ...data });
    } else {
      await createHighlight.mutateAsync({ projectId, ...data });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this highlight?')) {
      await deleteHighlight.mutateAsync({ id });
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Calendar size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Highlights & Breaks</h3>
            <p className="text-xs text-slate-500">Mark holidays, breaks, and milestones</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Add New Button */}
        {!isCreating && !editingId && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="w-full"
            variant="outline"
          >
            <Plus size={16} className="mr-2" />
            Add Highlight
          </Button>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-slate-700">
                {editingId ? 'Edit Highlight' : 'New Highlight'}
              </h4>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div>
              <Label className="text-xs">Name</Label>
              <Input
                type="text"
                placeholder="e.g., Mid-Semester Break"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => setFormData({ ...formData, colour: preset.color })}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      formData.colour === preset.color 
                        ? 'border-slate-900 scale-110' 
                        : 'border-transparent hover:border-slate-300'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
                <Input
                  type="color"
                  value={formData.colour}
                  onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                  className="w-8 h-8 p-0.5 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs text-slate-500">{formData.opacity}%</span>
              </div>
              <Input
                type="range"
                min="10"
                max="70"
                value={formData.opacity}
                onChange={(e) => setFormData({ ...formData, opacity: parseInt(e.target.value) })}
                className="h-2"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showLabel}
                  onChange={(e) => setFormData({ ...formData, showLabel: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-xs text-slate-600">Show Label</span>
              </label>

              {formData.showLabel && (
                <select
                  value={formData.labelPosition}
                  onChange={(e) => setFormData({ ...formData, labelPosition: e.target.value as 'top' | 'bottom' })}
                  className="h-8 text-xs rounded-md border border-slate-200 px-2"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              )}
            </div>

            {/* Preview */}
            <div className="h-12 rounded-md border border-slate-200 bg-white relative overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{ 
                  backgroundColor: formData.colour,
                  opacity: formData.opacity / 100
                }}
              />
              {formData.showLabel && formData.name && (
                <div className={`absolute left-0 right-0 flex justify-center ${
                  formData.labelPosition === 'top' ? 'top-1' : 'bottom-1'
                }`}>
                  <span 
                    className="px-2 py-0.5 text-[10px] font-semibold rounded whitespace-nowrap"
                    style={{
                      backgroundColor: formData.colour,
                      color: '#fff',
                      opacity: Math.min((formData.opacity / 100) + 0.5, 1)
                    }}
                  >
                    {formData.name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={!formData.name || !formData.startDate || !formData.endDate || createHighlight.isPending || updateHighlight.isPending}
                className="flex-1"
              >
                <Check size={16} className="mr-2" />
                {createHighlight.isPending || updateHighlight.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={resetForm} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing Highlights List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Highlights ({highlights.length})
          </h4>
          
          {highlights.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              No highlights yet. Add breaks, holidays, or milestones to visualize on the chart.
            </div>
          ) : (
            highlights.map((highlight) => (
              <div 
                key={highlight.id}
                className={`p-3 rounded-lg border transition-colors ${
                  editingId === highlight.id 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ 
                      backgroundColor: highlight.colour,
                      opacity: highlight.opacity / 100 + 0.3
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 truncate">
                      {highlight.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(highlight.startDate), 'MMM d')} - {format(new Date(highlight.endDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEditing(highlight)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(highlight.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      disabled={deleteHighlight.isPending}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

