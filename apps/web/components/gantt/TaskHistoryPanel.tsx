'use client';

import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Clock, User, Undo } from 'lucide-react';
import { format } from 'date-fns';

interface TaskHistoryPanelProps {
  taskId: string;
  taskName: string;
  onClose: () => void;
  onRevert?: (historyId: string) => void;
}

export function TaskHistoryPanel({ taskId, taskName, onClose, onRevert }: TaskHistoryPanelProps) {
  const { data: history, isLoading } = trpc.task.history.useQuery({
    id: taskId,
    limit: 50
  });
  
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATED': return 'Created task';
      case 'UPDATED': return 'Updated';
      case 'MOVED': return 'Moved dates';
      case 'RESIZED': return 'Resized';
      case 'STATUS_CHANGED': return 'Changed status';
      case 'RESOURCE_ASSIGNED': return 'Assigned resource';
      case 'RESOURCE_REMOVED': return 'Removed resource';
      case 'DELETED': return 'Deleted';
      default: return action;
    }
  };
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'text-green-700 bg-green-50 border-green-200';
      case 'DELETED': return 'text-red-700 bg-red-50 border-red-200';
      case 'RESOURCE_ASSIGNED': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'RESOURCE_REMOVED': return 'text-orange-700 bg-orange-50 border-orange-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };
  
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      if (value instanceof Date) return format(value, 'MMM d, yyyy');
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };
  
  return (
    <div className="fixed inset-y-0 right-0 w-[32rem] bg-white border-l border-slate-200 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-slate-600" />
            <h3 className="text-lg font-semibold">Task History</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="text-sm text-slate-600 mt-1 truncate">
          {taskName}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading history...</div>
        ) : history && history.length > 0 ? (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="relative space-y-6">
              {/* Vertical line */}
              <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-slate-200" />
              
              {history.map((entry, index) => {
                const isFirst = index === 0;
                
                return (
                  <div key={entry.id} className="relative pl-12">
                    {/* Timeline dot */}
                    <div className={`
                      absolute left-3 top-2 w-4 h-4 rounded-full border-2 
                      ${isFirst ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}
                    `} />
                    
                    <Card className={`border ${getActionColor(entry.action)}`}>
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-sm">
                              {getActionLabel(entry.action)}
                              {entry.fieldName && (
                                <span className="text-slate-600 ml-1">
                                  ({entry.fieldName})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <User size={12} />
                              <span>{entry.user.name || entry.user.email}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(entry.createdAt), 'MMM d, h:mm a')}
                          </div>
                        </div>
                        
                        {/* Changes */}
                        {entry.oldValue || entry.newValue ? (
                          <div className="space-y-2">
                            {entry.oldValue && (
                              <div className="bg-white rounded p-2 text-xs">
                                <div className="text-slate-500 mb-1">Old Value:</div>
                                <div className="font-mono text-red-700">
                                  {formatValue(entry.oldValue)}
                                </div>
                              </div>
                            )}
                            {entry.newValue && (
                              <div className="bg-white rounded p-2 text-xs">
                                <div className="text-slate-500 mb-1">New Value:</div>
                                <div className="font-mono text-green-700">
                                  {formatValue(entry.newValue)}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}
                        
                        {/* Revert button (only for recent changes) */}
                        {index < 5 && entry.action !== 'DELETED' && onRevert && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => onRevert(entry.id)}
                          >
                            <Undo size={14} className="mr-1" />
                            Revert to this version
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
            
            {/* Stats */}
            <Card className="bg-slate-50">
              <CardContent className="p-4">
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Total changes:</span>
                    <span className="font-medium">{history.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last modified:</span>
                    <span className="font-medium">
                      {format(new Date(history[0].createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contributors:</span>
                    <span className="font-medium">
                      {new Set(history.map(h => h.userId)).size}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-slate-50">
            <CardContent className="p-8 text-center">
              <Clock size={48} className="text-slate-400 mx-auto mb-3" />
              <div className="font-medium text-slate-700 mb-1">
                No history yet
              </div>
              <div className="text-sm text-slate-500">
                Changes to this task will appear here
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}





