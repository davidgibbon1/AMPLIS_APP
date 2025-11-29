'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, AlertTriangle } from 'lucide-react';

interface ResourcePanelProps {
  orgId: string;
  projectId: string;
  onClose: () => void;
}

export function ResourcePanel({ orgId, projectId, onClose }: ResourcePanelProps) {
  const [startDate] = useState(new Date());
  const [endDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days
  
  // Fetch resource capacity
  const { data: capacity, isLoading } = trpc.resource.capacity.useQuery({
    startDate,
    endDate
  });
  
  // Fetch people for the org
  const { data: people } = trpc.org.listPeople.useQuery();
  
  // Create custom resource
  const createCustomResource = trpc.resource.createCustom.useMutation();
  
  const handleCreateCustomResource = () => {
    const name = prompt("Custom Resource Name:");
    const rateStr = prompt("Hourly Rate:");
    
    if (name && rateStr) {
      createCustomResource.mutate({
        name,
        hourlyRate: parseFloat(rateStr),
        description: ''
      });
    }
  };
  
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resource Capacity</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
          <X size={20} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Date range selector (simplified) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Viewing Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600">
              Next 30 days
            </div>
          </CardContent>
        </Card>
        
        {/* Capacity Overview */}
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading capacity...</div>
        ) : capacity && capacity.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-700">Team Members</h4>
            {capacity.map((resource) => (
              <Card key={resource.resourceId} className={resource.overloaded ? 'border-red-300 bg-red-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{resource.resourceName}</div>
                      <div className="text-xs text-slate-500">{resource.resourceType}</div>
                    </div>
                    {resource.overloaded && (
                      <AlertTriangle size={16} className="text-red-500" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Allocated:</span>
                      <span className="font-medium">{resource.allocatedHours.toFixed(1)}h</span>
                    </div>
                    
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          resource.overloaded ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(resource.utilizationPct, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Utilization:</span>
                      <span className={`font-semibold ${
                        resource.overloaded ? 'text-red-600' : 
                        resource.utilizationPct > 80 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {resource.utilizationPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No resource allocations yet
          </div>
        )}
        
        {/* Custom Resources */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-slate-700">Custom Resources</h4>
            <Button size="sm" variant="outline" onClick={handleCreateCustomResource}>
              <Plus size={14} className="mr-1" />
              Add
            </Button>
          </div>
          
          <div className="text-sm text-slate-500">
            Create custom resources for contractors, equipment, or external services.
          </div>
        </div>
        
        {/* Utilization Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h5 className="font-semibold text-sm text-blue-900 mb-2">Capacity Tips</h5>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Over 100% = Overallocated</li>
              <li>• 80-100% = High utilization</li>
              <li>• 60-80% = Optimal range</li>
              <li>• Under 60% = Available capacity</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






