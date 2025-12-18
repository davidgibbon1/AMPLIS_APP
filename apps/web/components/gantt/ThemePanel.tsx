'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Palette, Check, ChevronDown, ChevronUp, Image, Type, Grid3X3 } from 'lucide-react';
import { GanttTheme } from '@/lib/gantt/types';
import { THEME_PRESETS, CATEGORY_COLOR_PALETTES, GanttThemeConfig } from '@/lib/gantt/themes';

interface ThemePanelProps {
  projectId: string;
  currentTheme: GanttTheme;
  onClose: () => void;
  onUpdate: () => void;
  selectedPreset?: string;
  onPresetChange?: (preset: string) => void;
}

export function ThemePanel({ 
  projectId, 
  currentTheme, 
  onClose, 
  onUpdate,
  selectedPreset = 'corporate',
  onPresetChange
}: ThemePanelProps) {
  const [theme, setTheme] = useState(currentTheme);
  const [activePreset, setActivePreset] = useState(selectedPreset);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['presets', 'colors']));
  
  const updateTheme = trpc.theme.update.useMutation({
    onSuccess: () => {
      onUpdate();
    }
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };
  
  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setActivePreset(presetName);
      onPresetChange?.(presetName);
      // Update background color from preset
      setTheme(prev => ({
        ...prev,
        backgroundColour: preset.backgroundColor
      }));
    }
  };
  
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
    setActivePreset('corporate');
  };
  
  const Section = ({ 
    id, 
    title, 
    icon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode 
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border-b border-slate-200 last:border-b-0">
        <button
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {icon}
            {title}
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Palette size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Theme & Branding</h3>
            <p className="text-xs text-slate-500">Customize your Gantt chart appearance</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Theme Presets Section */}
        <Section id="presets" title="Theme Presets" icon={<Palette size={16} />}>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(THEME_PRESETS).map(([name, preset]) => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={`
                  relative p-3 rounded-lg border-2 text-left transition-all
                  ${activePreset === name 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                {/* Preview colors */}
                <div className="flex gap-1 mb-2">
                  <div 
                    className="w-6 h-6 rounded-sm"
                    style={{ 
                      background: preset.headerBackground.includes('gradient') 
                        ? preset.headerBackground 
                        : preset.headerBackground 
                    }}
                  />
                  <div 
                    className="w-6 h-6 rounded-sm"
                    style={{ backgroundColor: preset.categoryColors[0] }}
                  />
                  <div 
                    className="w-6 h-6 rounded-sm"
                    style={{ backgroundColor: preset.backgroundColor }}
                  />
                </div>
                <div className="text-xs font-medium text-slate-700 capitalize">{name}</div>
                {activePreset === name && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Category Color Palettes */}
        <Section id="palettes" title="Category Colors" icon={<Grid3X3 size={16} />}>
          <p className="text-xs text-slate-500 mb-3">
            Colors used for deliverable/phase categories
          </p>
          <div className="space-y-3">
            {Object.entries(CATEGORY_COLOR_PALETTES).map(([paletteName, colors]) => (
              <div key={paletteName} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-slate-600 capitalize">
                  {paletteName}
                </div>
                <div className="flex gap-1 flex-1">
                  {colors.map((color, i) => (
                    <div 
                      key={i}
                      className="w-6 h-6 rounded-sm border border-slate-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Colors Section */}
        <Section id="colors" title="Custom Colors" icon={<Palette size={16} />}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Primary</Label>
              <div className="flex gap-1.5 mt-1">
                <Input
                  type="color"
                  value={theme.primaryColour}
                  onChange={(e) => setTheme({ ...theme, primaryColour: e.target.value })}
                  className="w-10 h-9 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.primaryColour}
                  onChange={(e) => setTheme({ ...theme, primaryColour: e.target.value })}
                  className="flex-1 h-9 text-xs font-mono"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Accent</Label>
              <div className="flex gap-1.5 mt-1">
                <Input
                  type="color"
                  value={theme.accentColour}
                  onChange={(e) => setTheme({ ...theme, accentColour: e.target.value })}
                  className="w-10 h-9 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.accentColour}
                  onChange={(e) => setTheme({ ...theme, accentColour: e.target.value })}
                  className="flex-1 h-9 text-xs font-mono"
                />
              </div>
            </div>
            
            <div className="col-span-2">
              <Label className="text-xs">Background</Label>
              <div className="flex gap-1.5 mt-1">
                <Input
                  type="color"
                  value={theme.backgroundColour}
                  onChange={(e) => setTheme({ ...theme, backgroundColour: e.target.value })}
                  className="w-10 h-9 p-0.5 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.backgroundColour}
                  onChange={(e) => setTheme({ ...theme, backgroundColour: e.target.value })}
                  className="flex-1 h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Background Image Section */}
        <Section id="background" title="Background Image" icon={<Image size={16} />}>
          <div>
            <Label className="text-xs">Image URL</Label>
            <Input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={theme.backgroundImageUrl || ''}
              onChange={(e) => setTheme({ ...theme, backgroundImageUrl: e.target.value || null })}
              className="mt-1 h-9 text-xs"
            />
          </div>
          
          {theme.backgroundImageUrl && (
            <>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs">Blur</Label>
                  <span className="text-xs text-slate-500">{theme.backgroundBlur}px</span>
                </div>
                <Input
                  type="range"
                  min="0"
                  max="20"
                  value={theme.backgroundBlur}
                  onChange={(e) => setTheme({ ...theme, backgroundBlur: parseInt(e.target.value) })}
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs">Overlay Dim</Label>
                  <span className="text-xs text-slate-500">{theme.backgroundDim}%</span>
                </div>
                <Input
                  type="range"
                  min="0"
                  max="80"
                  value={theme.backgroundDim}
                  onChange={(e) => setTheme({ ...theme, backgroundDim: parseInt(e.target.value) })}
                  className="h-2"
                />
              </div>
              
              {/* Preview */}
              <div 
                className="h-24 rounded-lg border border-slate-200 bg-cover bg-center relative overflow-hidden"
                style={{ backgroundImage: `url(${theme.backgroundImageUrl})` }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    backdropFilter: `blur(${theme.backgroundBlur}px)`,
                    backgroundColor: `rgba(0,0,0,${theme.backgroundDim / 100})`,
                  }}
                />
              </div>
            </>
          )}
        </Section>

        {/* Logo Section */}
        <Section id="logo" title="Company Logo" icon={<Type size={16} />}>
          <div>
            <Label className="text-xs">Logo URL</Label>
            <Input
              type="text"
              placeholder="https://example.com/logo.png"
              value={theme.logoUrl || ''}
              onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value || null })}
              className="mt-1 h-9 text-xs"
            />
          </div>
          
          {theme.logoUrl && (
            <>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs">Opacity</Label>
                  <span className="text-xs text-slate-500">{theme.logoOpacity}%</span>
                </div>
                <Input
                  type="range"
                  min="10"
                  max="100"
                  value={theme.logoOpacity}
                  onChange={(e) => setTheme({ ...theme, logoOpacity: parseInt(e.target.value) })}
                  className="h-2"
                />
              </div>
              
              <div>
                <Label className="text-xs">Position</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setTheme({ ...theme, logoPosition: pos })}
                      className={`
                        px-3 py-2 text-xs rounded-md border transition-colors
                        ${theme.logoPosition === pos 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-slate-200 hover:bg-slate-50'
                        }
                      `}
                    >
                      {pos.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Preview */}
              <div className="h-20 rounded-lg border border-slate-200 bg-slate-100 relative overflow-hidden">
                <img 
                  src={theme.logoUrl} 
                  alt="Logo preview"
                  className={`
                    absolute max-w-[60px] max-h-[30px] object-contain
                    ${theme.logoPosition === 'top-left' ? 'top-2 left-2' : ''}
                    ${theme.logoPosition === 'top-right' ? 'top-2 right-2' : ''}
                    ${theme.logoPosition === 'bottom-left' ? 'bottom-2 left-2' : ''}
                    ${theme.logoPosition === 'bottom-right' ? 'bottom-2 right-2' : ''}
                  `}
                  style={{ opacity: theme.logoOpacity / 100 }}
                />
              </div>
            </>
          )}
        </Section>
      </div>
      
      {/* Footer - Fixed */}
      <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-slate-50 space-y-2">
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            className="flex-1 bg-blue-600 hover:bg-blue-700" 
            disabled={updateTheme.isPending}
          >
            {updateTheme.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={handleReset} variant="outline" className="px-4">
            Reset
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 text-center">
          Theme presets affect header, grid, and task bar styling
        </p>
      </div>
    </div>
  );
}
