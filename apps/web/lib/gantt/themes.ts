import { GridSettings, DEFAULT_GRID_SETTINGS } from '@/components/gantt/GridLayer';

export interface GanttThemeConfig {
  // Header styling
  headerBackground: string;
  headerText: string;
  weekRowBackground: string;
  weekRowText: string;
  
  // Category/Deliverable colors
  categoryColors: string[];
  
  // Task bar styling
  taskBarStyle: {
    borderRadius: 'none' | 'small' | 'medium' | 'full';
    showProgress: boolean;
    progressStyle: 'overlay' | 'stripe' | 'fill';
    shadow: 'none' | 'small' | 'medium';
    showLabel: boolean;
  };
  
  // Grid settings
  grid: Partial<GridSettings>;
  
  // Background
  backgroundColor: string;
  
  // Font
  fontFamily?: string;
}

export const CATEGORY_COLOR_PALETTES = {
  professional: [
    '#0d9488', // Teal
    '#dc2626', // Red
    '#16a34a', // Green
    '#2563eb', // Blue
    '#9333ea', // Purple
    '#ea580c', // Orange
  ],
  pastel: [
    '#86efac', // Light green
    '#fca5a5', // Light red
    '#93c5fd', // Light blue
    '#c4b5fd', // Light purple
    '#fcd34d', // Light yellow
    '#fdba74', // Light orange
  ],
  vibrant: [
    '#f43f5e', // Rose
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
  ],
  monochrome: [
    '#1e293b', // Slate 800
    '#334155', // Slate 700
    '#475569', // Slate 600
    '#64748b', // Slate 500
    '#94a3b8', // Slate 400
    '#cbd5e1', // Slate 300
  ],
};

export const THEME_PRESETS: Record<string, GanttThemeConfig> = {
  corporate: {
    headerBackground: '#1e3a5f',
    headerText: '#ffffff',
    weekRowBackground: '#f1f5f9',
    weekRowText: '#475569',
    categoryColors: CATEGORY_COLOR_PALETTES.professional,
    taskBarStyle: {
      borderRadius: 'small',
      showProgress: true,
      progressStyle: 'overlay',
      shadow: 'small',
      showLabel: true,
    },
    grid: {
      ...DEFAULT_GRID_SETTINGS,
      showWeekendHighlight: true,
      alternateRowBackground: true,
    },
    backgroundColor: '#ffffff',
  },
  
  academic: {
    headerBackground: '#7c3aed',
    headerText: '#ffffff',
    weekRowBackground: '#f5f3ff',
    weekRowText: '#6b21a8',
    categoryColors: ['#0d9488', '#dc2626', '#16a34a', '#7c3aed', '#2563eb'],
    taskBarStyle: {
      borderRadius: 'small',
      showProgress: true,
      progressStyle: 'fill',
      shadow: 'none',
      showLabel: true,
    },
    grid: {
      ...DEFAULT_GRID_SETTINGS,
      showWeekendHighlight: true,
      weekendColor: 'rgba(124, 58, 237, 0.05)',
    },
    backgroundColor: '#faf5ff',
  },
  
  minimal: {
    headerBackground: '#f8fafc',
    headerText: '#1e293b',
    weekRowBackground: '#ffffff',
    weekRowText: '#64748b',
    categoryColors: CATEGORY_COLOR_PALETTES.monochrome,
    taskBarStyle: {
      borderRadius: 'medium',
      showProgress: false,
      progressStyle: 'overlay',
      shadow: 'none',
      showLabel: true,
    },
    grid: {
      showRowLines: true,
      rowLineColor: '#f1f5f9',
      alternateRowBackground: false,
      alternateRowColor: '#ffffff',
      showDayLines: false,
      showWeekLines: true,
      showMonthLines: true,
      dayLineColor: '#f1f5f9',
      weekLineColor: '#e2e8f0',
      monthLineColor: '#e2e8f0',
      showWeekendHighlight: false,
      weekendColor: 'transparent',
      todayLineColor: '#3b82f6',
      todayLineWidth: 2,
      showTodayHighlight: false,
      todayHighlightColor: 'transparent',
    },
    backgroundColor: '#ffffff',
  },
  
  vibrant: {
    headerBackground: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    headerText: '#ffffff',
    weekRowBackground: '#fdf4ff',
    weekRowText: '#a21caf',
    categoryColors: CATEGORY_COLOR_PALETTES.vibrant,
    taskBarStyle: {
      borderRadius: 'full',
      showProgress: true,
      progressStyle: 'stripe',
      shadow: 'medium',
      showLabel: true,
    },
    grid: {
      ...DEFAULT_GRID_SETTINGS,
      todayLineColor: '#ec4899',
      showWeekendHighlight: true,
      weekendColor: 'rgba(236, 72, 153, 0.05)',
    },
    backgroundColor: '#fffbfe',
  },
  
  dark: {
    headerBackground: '#0f172a',
    headerText: '#f8fafc',
    weekRowBackground: '#1e293b',
    weekRowText: '#94a3b8',
    categoryColors: ['#22d3ee', '#a78bfa', '#4ade80', '#fb923c', '#f472b6', '#facc15'],
    taskBarStyle: {
      borderRadius: 'small',
      showProgress: true,
      progressStyle: 'overlay',
      shadow: 'small',
      showLabel: true,
    },
    grid: {
      showRowLines: true,
      rowLineColor: '#334155',
      alternateRowBackground: true,
      alternateRowColor: '#1e293b',
      showDayLines: true,
      showWeekLines: true,
      showMonthLines: true,
      dayLineColor: '#1e293b',
      weekLineColor: '#334155',
      monthLineColor: '#475569',
      showWeekendHighlight: true,
      weekendColor: 'rgba(15, 23, 42, 0.5)',
      todayLineColor: '#22d3ee',
      todayLineWidth: 2,
      showTodayHighlight: false,
      todayHighlightColor: 'rgba(34, 211, 238, 0.1)',
    },
    backgroundColor: '#0f172a',
  },
  
  nature: {
    headerBackground: '#166534',
    headerText: '#ffffff',
    weekRowBackground: '#f0fdf4',
    weekRowText: '#166534',
    categoryColors: ['#166534', '#ca8a04', '#0369a1', '#9f1239', '#7c2d12', '#4c1d95'],
    taskBarStyle: {
      borderRadius: 'medium',
      showProgress: true,
      progressStyle: 'fill',
      shadow: 'small',
      showLabel: true,
    },
    grid: {
      ...DEFAULT_GRID_SETTINGS,
      todayLineColor: '#166534',
      showWeekendHighlight: true,
      weekendColor: 'rgba(22, 101, 52, 0.05)',
    },
    backgroundColor: '#f0fdf4',
  },
};

// Helper to get a category color from the palette
export function getCategoryColor(index: number, palette: string[] = CATEGORY_COLOR_PALETTES.professional): string {
  return palette[index % palette.length];
}

// Helper to apply theme to existing data
export function applyThemeToDeliverables(
  deliverables: Array<{ id: string; colour?: string | null }>,
  theme: GanttThemeConfig
): Map<string, string> {
  const colorMap = new Map<string, string>();
  
  deliverables.forEach((del, index) => {
    if (del.colour) {
      colorMap.set(del.id, del.colour);
    } else {
      colorMap.set(del.id, getCategoryColor(index, theme.categoryColors));
    }
  });
  
  return colorMap;
}

