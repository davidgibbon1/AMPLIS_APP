'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Palette } from 'lucide-react';
import { GanttTheme } from '@/lib/gantt/types';

interface ThemePanelProps {
  projectId: string;
  currentTheme: GanttTheme;
  onClose: () => void;
  onUpdate: () => void;
}

export function ThemePanel({ projectId, currentTheme, onClose, onUpdate }: ThemePanelProps) {
  const [theme, setTheme] = useState(currentTheme);
  
  const updateTheme = trpc.theme.update.useMutation({
    onSuccess: () => {
      onUpdate();
    }
  });
  
  const handleSave = async () => {
    try {
      await updateTheme.mutateAsync({
        projectId,
        ...theme
      });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };
  
  const handleReset = () => {
    setTheme({
      primaryColour: '#3b82f6',
      accentColour: '#1e40af',
      backgroundColour: '#f8fafc',
      backgroundImageUrl: null,
      backgroundBlur: 0,
      backgroundDim: 0,
      logoUrl: null,
      logoOpacity: 30,
      logoPosition: 'bottom-right'
    });
  };
  
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={20} />
          <h3 className="text-lg font-semibold">Theme Settings</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
          <X size={20} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primaryColour">Primary Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="primaryColour"
                  type="color"
                  value={theme.primaryColour}
                  onChange={(e) => setTheme({ ...theme, primaryColour: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={theme.primaryColour}
                  onChange={(e) => setTheme({ ...theme, primaryColour: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="accentColour">Accent Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="accentColour"
                  type="color"
                  value={theme.accentColour}
                  onChange={(e) => setTheme({ ...theme, accentColour: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={theme.accentColour}
                  onChange={(e) => setTheme({ ...theme, accentColour: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="backgroundColour">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="backgroundColour"
                  type="color"
                  value={theme.backgroundColour}
                  onChange={(e) => setTheme({ ...theme, backgroundColour: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={theme.backgroundColour}
                  onChange={(e) => setTheme({ ...theme, backgroundColour: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Background Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Background Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backgroundImageUrl">Image URL</Label>
              <Input
                id="backgroundImageUrl"
                type="text"
                placeholder="https://..."
                value={theme.backgroundImageUrl || ''}
                onChange={(e) => setTheme({ ...theme, backgroundImageUrl: e.target.value || null })}
                className="mt-1"
              />
            </div>
            
            {theme.backgroundImageUrl && (
              <>
                <div>
                  <Label htmlFor="backgroundBlur">
                    Blur: {theme.backgroundBlur}px
                  </Label>
                  <Input
                    id="backgroundBlur"
                    type="range"
                    min="0"
                    max="100"
                    value={theme.backgroundBlur}
                    onChange={(e) => setTheme({ ...theme, backgroundBlur: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="backgroundDim">
                    Dim: {theme.backgroundDim}%
                  </Label>
                  <Input
                    id="backgroundDim"
                    type="range"
                    min="0"
                    max="100"
                    value={theme.backgroundDim}
                    onChange={(e) => setTheme({ ...theme, backgroundDim: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Company Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="text"
                placeholder="https://..."
                value={theme.logoUrl || ''}
                onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value || null })}
                className="mt-1"
              />
            </div>
            
            {theme.logoUrl && (
              <>
                <div>
                  <Label htmlFor="logoOpacity">
                    Opacity: {theme.logoOpacity}%
                  </Label>
                  <Input
                    id="logoOpacity"
                    type="range"
                    min="5"
                    max="70"
                    value={theme.logoOpacity}
                    onChange={(e) => setTheme({ ...theme, logoOpacity: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="logoPosition">Position</Label>
                  <select
                    id="logoPosition"
                    value={theme.logoPosition}
                    onChange={(e) => setTheme({ ...theme, logoPosition: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1" disabled={updateTheme.isLoading}>
            {updateTheme.isLoading ? 'Saving...' : 'Save Theme'}
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
        </div>
        
        {/* Preview */}
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <div className="text-xs text-slate-600 mb-2">Preview Colors:</div>
            <div className="flex gap-2">
              <div 
                className="w-12 h-12 rounded border" 
                style={{ backgroundColor: theme.primaryColour }}
                title="Primary"
              />
              <div 
                className="w-12 h-12 rounded border" 
                style={{ backgroundColor: theme.accentColour }}
                title="Accent"
              />
              <div 
                className="w-12 h-12 rounded border" 
                style={{ backgroundColor: theme.backgroundColour }}
                title="Background"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






