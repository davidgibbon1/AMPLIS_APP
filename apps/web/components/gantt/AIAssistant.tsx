'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface AIAssistantProps {
  projectId: string;
  onClose: () => void;
  onApplySuggestion: () => void;
}

export function AIAssistant({ projectId, onClose, onApplySuggestion }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'conflicts' | 'optimize'>('conflicts');
  
  // Detect conflicts
  const { data: conflicts, isLoading: loadingConflicts } = trpc.ai.detectConflicts.useQuery({
    projectId
  });
  
  // Suggest schedule
  const suggestSchedule = trpc.ai.suggestSchedule.useMutation();
  
  // Optimize timeline
  const optimizeTimeline = trpc.ai.optimizeTimeline.useMutation();
  
  const handleSuggestSchedule = async () => {
    try {
      await suggestSchedule.mutateAsync({ projectId });
    } catch (error) {
      console.error('Failed to generate schedule:', error);
    }
  };
  
  const handleOptimize = async () => {
    try {
      await optimizeTimeline.mutateAsync({
        projectId,
        constraints: {
          preferEvenDistribution: true,
          minimizeOverlaps: true,
          respectDependencies: true
        }
      });
    } catch (error) {
      console.error('Failed to optimize timeline:', error);
    }
  };
  
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <h3 className="text-lg font-semibold">AI Assistant</h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-purple-100">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-purple-100">
          Intelligent scheduling suggestions and conflict detection
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('conflicts')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'conflicts' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Conflicts
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'schedule' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Auto-Schedule
        </button>
        <button
          onClick={() => setActiveTab('optimize')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'optimize' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Optimize
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Conflicts Tab */}
        {activeTab === 'conflicts' && (
          <div className="space-y-4">
            {loadingConflicts ? (
              <div className="text-center py-8 text-slate-500">Analyzing conflicts...</div>
            ) : conflicts && conflicts.conflicts.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle size={16} />
                  <span>{conflicts.conflicts.length} conflicts detected</span>
                </div>
                
                {conflicts.conflicts.map((conflict, index) => (
                  <Card key={index} className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                        <div className="flex-1 text-sm">
                          <div className="font-medium text-amber-900 mb-1">
                            {conflict.message}
                          </div>
                          <div className="text-amber-700 space-y-1">
                            <div>• {conflict.task1Name}</div>
                            <div>• {conflict.task2Name}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded p-2 text-xs text-slate-600">
                        <strong>Suggestion:</strong> {conflict.suggestion}
                      </div>
                      
                      <Button size="sm" variant="outline" className="w-full">
                        Fix Automatically
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <CheckCircle size={48} className="text-green-600 mx-auto mb-3" />
                  <div className="font-medium text-green-900 mb-1">
                    No conflicts detected
                  </div>
                  <div className="text-sm text-green-700">
                    Your timeline is optimally scheduled!
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Auto-Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI-Powered Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Let AI automatically schedule all unscheduled tasks based on:
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Task dependencies</li>
                  <li>• Resource availability</li>
                  <li>• Estimated durations</li>
                  <li>• Project deadlines</li>
                </ul>
                
                <Button 
                  onClick={handleSuggestSchedule}
                  disabled={suggestSchedule.isLoading}
                  className="w-full"
                >
                  {suggestSchedule.isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} />
                      Generate Schedule
                    </span>
                  )}
                </Button>
                
                {suggestSchedule.data && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      {suggestSchedule.data.suggestions.length} suggestions generated
                    </div>
                    <div className="space-y-2">
                      {suggestSchedule.data.suggestions.slice(0, 3).map((suggestion, i) => (
                        <div key={i} className="text-xs text-blue-800">
                          • Task {i + 1}: {new Date(suggestion.suggestedStartDate).toLocaleDateString()} - {new Date(suggestion.suggestedEndDate).toLocaleDateString()}
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="w-full mt-3">
                      Apply Suggestions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Optimize Tab */}
        {activeTab === 'optimize' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Timeline Optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Optimize your entire project timeline to:
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Minimize resource conflicts</li>
                  <li>• Balance team utilization</li>
                  <li>• Reduce project duration</li>
                  <li>• Maximize efficiency</li>
                </ul>
                
                <Button 
                  onClick={handleOptimize}
                  disabled={optimizeTimeline.isLoading}
                  className="w-full"
                >
                  {optimizeTimeline.isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Optimizing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} />
                      Optimize Timeline
                    </span>
                  )}
                </Button>
                
                {optimizeTimeline.data && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-green-900 mb-2">
                      Optimization complete!
                    </div>
                    <div className="text-xs text-green-800 space-y-1 mb-3">
                      <div>• {optimizeTimeline.data.estimatedImprovement.conflictsReduced} conflicts resolved</div>
                      <div>• {optimizeTimeline.data.estimatedImprovement.avgUtilizationImprovement}% utilization improvement</div>
                    </div>
                    {optimizeTimeline.data.optimizations.slice(0, 2).map((opt, i) => (
                      <div key={i} className="bg-white rounded p-2 mb-2 text-xs">
                        <div className="font-medium text-slate-900">{opt.message}</div>
                        <div className="text-slate-600 mt-1">Impact: {opt.impact}</div>
                      </div>
                    ))}
                    <Button size="sm" className="w-full">
                      Apply Optimizations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Info Card */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <h5 className="font-semibold text-sm text-purple-900 mb-2 flex items-center gap-2">
              <Sparkles size={14} />
              How AI Helps
            </h5>
            <ul className="text-xs text-purple-800 space-y-1">
              <li>• Analyzes thousands of scheduling scenarios instantly</li>
              <li>• Learns from your project patterns and preferences</li>
              <li>• Suggests optimal resource allocations</li>
              <li>• Predicts potential bottlenecks before they occur</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






