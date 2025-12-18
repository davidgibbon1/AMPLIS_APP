'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Download, 
  FileImage, 
  FileText, 
  Link2, 
  Check,
  Loader2 
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface ExportModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

type ExportFormat = 'png' | 'pdf' | 'link';

export function ExportModal({ projectId, projectName, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ url: string; expiresAt?: Date } | null>(null);
  
  // Export options
  const [options, setOptions] = useState({
    includeResources: true,
    includeFinancials: false,
    includeLogo: true,
    highResolution: false,
    width: 1920,
    height: 1080,
    linkExpiresDays: 30
  });
  
  const exportPNG = trpc.gantt.exportPNG.useMutation();
  const exportPDF = trpc.gantt.exportPDF.useMutation();
  const generateLink = trpc.gantt.shareableLink.useMutation();

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);
    
    try {
      let result;
      
      switch (format) {
        case 'png':
          result = await exportPNG.mutateAsync({
            projectId,
            width: options.highResolution ? options.width * 2 : options.width,
            height: options.highResolution ? options.height * 2 : options.height
          });
          break;
        case 'pdf':
          result = await exportPDF.mutateAsync({
            projectId,
            options: {
              includeResources: options.includeResources,
              includeFinancials: options.includeFinancials
            }
          });
          break;
        case 'link':
          result = await generateLink.mutateAsync({
            projectId,
            expiresIn: options.linkExpiresDays
          });
          break;
      }
      
      if (result) {
        setExportResult({
          url: result.url,
          expiresAt: 'expiresAt' in result ? result.expiresAt : undefined
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Export Gantt Chart</h2>
            <p className="text-sm text-slate-500 mt-0.5">{projectName}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <button
                onClick={() => setFormat('png')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  format === 'png' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileImage size={24} className={format === 'png' ? 'text-blue-600' : 'text-slate-400'} />
                <span className={`text-sm font-medium ${format === 'png' ? 'text-blue-700' : 'text-slate-600'}`}>
                  PNG Image
                </span>
              </button>
              
              <button
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  format === 'pdf' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileText size={24} className={format === 'pdf' ? 'text-blue-600' : 'text-slate-400'} />
                <span className={`text-sm font-medium ${format === 'pdf' ? 'text-blue-700' : 'text-slate-600'}`}>
                  PDF Document
                </span>
              </button>
              
              <button
                onClick={() => setFormat('link')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  format === 'link' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Link2 size={24} className={format === 'link' ? 'text-blue-600' : 'text-slate-400'} />
                <span className={`text-sm font-medium ${format === 'link' ? 'text-blue-700' : 'text-slate-600'}`}>
                  Share Link
                </span>
              </button>
            </div>
          </div>

          {/* Format-specific options */}
          {format === 'png' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">High Resolution (2x)</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Better for printing</p>
                </div>
                <input
                  type="checkbox"
                  checked={options.highResolution}
                  onChange={(e) => setOptions({ ...options, highResolution: e.target.checked })}
                  className="rounded border-slate-300"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Width (px)</Label>
                  <Input
                    type="number"
                    value={options.width}
                    onChange={(e) => setOptions({ ...options, width: parseInt(e.target.value) || 1920 })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Height (px)</Label>
                  <Input
                    type="number"
                    value={options.height}
                    onChange={(e) => setOptions({ ...options, height: parseInt(e.target.value) || 1080 })}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {format === 'pdf' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Include Resource Information</Label>
                <input
                  type="checkbox"
                  checked={options.includeResources}
                  onChange={(e) => setOptions({ ...options, includeResources: e.target.checked })}
                  className="rounded border-slate-300"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Include Financial Data</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Budgets, costs, and margins</p>
                </div>
                <input
                  type="checkbox"
                  checked={options.includeFinancials}
                  onChange={(e) => setOptions({ ...options, includeFinancials: e.target.checked })}
                  className="rounded border-slate-300"
                />
              </div>
            </div>
          )}

          {format === 'link' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label className="text-sm">Link Expires In</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={options.linkExpiresDays}
                    onChange={(e) => setOptions({ ...options, linkExpiresDays: parseInt(e.target.value) || 30 })}
                    className="w-24 h-9"
                    min={1}
                    max={365}
                  />
                  <span className="text-sm text-slate-600">days</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500">
                Anyone with this link can view the Gantt chart (read-only). 
                The link will expire after the specified period.
              </p>
            </div>
          )}

          {/* Export Result */}
          {exportResult && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check size={16} />
                <span className="text-sm font-medium">Export Ready!</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={exportResult.url}
                  readOnly
                  className="flex-1 h-9 text-xs bg-white"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(exportResult.url)}
                >
                  Copy
                </Button>
              </div>
              
              {exportResult.expiresAt && (
                <p className="text-xs text-green-600 mt-2">
                  Expires: {new Date(exportResult.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

