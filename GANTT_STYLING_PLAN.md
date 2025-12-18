# Comprehensive Gantt Chart Styling Plan

Based on the Griffith University example, this document outlines a complete plan to transform the Gantt view into a professional, highly customizable presentation-ready chart.

---

## 📋 Feature Overview

| Feature | Priority | Complexity | Status |
|---------|----------|------------|--------|
| 1. Category Color Groups | High | Medium | Planned |
| 2. Enhanced Timeline Header | High | Medium | Planned |
| 3. Highlighted Periods/Breaks | High | High | Planned |
| 4. Logo & Branding | Medium | Low | Partial |
| 5. Task Bar Styling | High | Medium | Planned |
| 6. Grid & Layout Polish | Medium | Low | Planned |
| 7. Export to PDF/Image | Medium | Medium | Planned |
| 8. Theme Presets | Low | Low | Planned |

---

## 1. Category Color Groups (Deliverable Styling)

### Goal
Allow each deliverable/phase to have a distinct color scheme with vertical labels like "Research & Planning", "Fabrication & Testing".

### Database Changes
```prisma
// Already have `colour` on Deliverable - extend with:
model Deliverable {
  colour           String?   // Primary color (already exists)
  colourSecondary  String?   // Optional secondary/accent color
  showCategoryLabel Boolean @default(true)
}
```

### UI Components

#### A. Vertical Category Labels (Left Strip)
- Rotated 90° text showing deliverable name
- Background color matching deliverable color
- White text for contrast
- Spans all tasks within that deliverable

```tsx
// New component: CategoryLabel.tsx
interface CategoryLabelProps {
  name: string;
  colour: string;
  height: number; // Total height of all tasks in this category
  rowStart: number;
}
```

#### B. Task Bar Color Inheritance
- Tasks inherit color from parent deliverable
- Option to override at task level
- Color palette suggestions based on category

### Implementation Tasks
- [ ] Add `colourSecondary` to Deliverable model
- [ ] Create `CategoryLabel` component
- [ ] Update `TaskSidebar` to render category strips
- [ ] Add color picker to deliverable settings
- [ ] Implement color inheritance for task bars

---

## 2. Enhanced Timeline Header

### Goal
Professional header with month backgrounds, week numbers, and clean typography like the example.

### Design
```
┌─────────────────────────────────────────────────────────────┐
│  ████ Mar ████  │  ████ Apr ████  │  ████ May ████  │  Jun  │  <- Colored month bands
├──┬──┬──┬──┬──┬──┼──┬──┬──┬──┬──┬──┼──┬──┬──┬──┬──┬──┼──┬──┤
│ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│10│11│12│13│14│15│16│17│18│19│20│  <- Week numbers
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
```

### Theme Settings
```typescript
interface TimelineTheme {
  headerBackground: string;      // Primary header color (dark blue in example)
  headerText: string;            // Header text color (white)
  weekRowBackground: string;     // Week number row bg (light gray)
  weekRowText: string;           // Week number text color
  showWeekNumbers: boolean;      // Toggle week numbers
  weekNumberFormat: 'number' | 'date'; // "1, 2, 3" vs "Mar 1, Mar 8"
}
```

### Implementation Tasks
- [ ] Create two-row header (months + weeks)
- [ ] Add colored month background bands
- [ ] Implement week number row
- [ ] Add theme controls for header colors
- [ ] Support zoom-level appropriate labels (days/weeks/months)

---

## 3. Highlighted Periods / Breaks

### Goal
Allow marking date ranges as breaks, holidays, or special periods with visual highlighting.

### Database Schema
```prisma
model GanttHighlight {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  
  name        String              // "Mid Semester Break", "Holiday"
  startDate   DateTime
  endDate     DateTime
  colour      String   @default("#E5E7EB") // Gray by default
  opacity     Int      @default(30)        // 0-100
  showLabel   Boolean  @default(true)
  labelPosition String @default("bottom") // "top", "bottom", "none"
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### UI Components

#### A. Highlight Overlay
- Semi-transparent colored column spanning the date range
- Renders behind task bars but above grid
- Z-index management for proper layering

```tsx
// New component: HighlightOverlay.tsx
interface HighlightOverlayProps {
  highlight: GanttHighlight;
  pixelsPerDay: number;
  timelineStart: Date;
  totalHeight: number;
}
```

#### B. Highlight Label
- Positioned at bottom of chart (or top)
- Bracket/arrow pointing to the highlighted period
- Clean typography

#### C. Highlight Management Panel
- Add/edit/delete highlights
- Color picker
- Date range selector
- Preview

### Implementation Tasks
- [ ] Create `GanttHighlight` database model
- [ ] Create migration
- [ ] Add TRPC routes for CRUD operations
- [ ] Create `HighlightOverlay` component
- [ ] Create `HighlightLabel` component
- [ ] Build highlight management panel
- [ ] Integrate into GanttCanvas

---

## 4. Logo & Branding (Enhancement)

### Current State
Already have basic logo support via `ThemeSettings`:
- `logoUrl`
- `logoOpacity`
- `logoPosition`

### Enhancements Needed
```prisma
model ThemeSettings {
  // Existing fields...
  
  // New logo fields
  logoSize        Int      @default(100)  // Percentage 50-200
  logoMarginX     Int      @default(20)   // Pixels from edge
  logoMarginY     Int      @default(20)
  
  // Header branding
  showProjectName Boolean  @default(true)
  projectNamePosition String @default("top-left")
  companyName     String?
  showCompanyName Boolean  @default(false)
}
```

### Implementation Tasks
- [ ] Add logo size controls
- [ ] Add margin controls
- [ ] Implement project/company name display
- [ ] Add header branding options
- [ ] Support watermark mode

---

## 5. Task Bar Styling

### Goal
Rich task bar styling with progress, patterns, and visual hierarchy.

### Options
```typescript
interface TaskBarStyle {
  // Shape
  borderRadius: 'none' | 'small' | 'medium' | 'full';
  height: 'compact' | 'normal' | 'large';
  
  // Colors
  useGradient: boolean;
  gradientDirection: 'horizontal' | 'vertical';
  
  // Progress
  showProgress: boolean;
  progressStyle: 'overlay' | 'stripe' | 'fill';
  
  // Borders
  borderWidth: number;
  borderColor: string;
  
  // Text
  showLabel: boolean;
  labelPosition: 'inside' | 'above' | 'below' | 'right';
  labelTruncate: boolean;
  
  // Effects
  shadow: 'none' | 'small' | 'medium';
  hoverEffect: boolean;
}
```

### Task Status Visual Mapping
```typescript
const STATUS_STYLES = {
  NOT_STARTED: {
    pattern: 'solid',
    opacity: 0.6,
    borderStyle: 'dashed'
  },
  IN_PROGRESS: {
    pattern: 'solid',
    opacity: 1,
    borderStyle: 'solid'
  },
  COMPLETED: {
    pattern: 'solid',
    opacity: 1,
    borderStyle: 'solid',
    checkmark: true
  },
  BLOCKED: {
    pattern: 'diagonal-stripes',
    opacity: 1,
    borderStyle: 'solid'
  }
};
```

### Implementation Tasks
- [ ] Add task bar style settings to theme
- [ ] Implement gradient backgrounds
- [ ] Add progress visualization options
- [ ] Support label positioning
- [ ] Add status-based styling
- [ ] Implement hover/selection effects

---

## 6. Grid & Layout Polish

### Goal
Clean, professional grid with proper spacing and visual hierarchy.

### Grid Settings
```typescript
interface GridSettings {
  // Horizontal lines
  showRowLines: boolean;
  rowLineColor: string;
  rowLineStyle: 'solid' | 'dashed' | 'dotted';
  alternateRowBackground: boolean;
  alternateRowColor: string;
  
  // Vertical lines
  showDayLines: boolean;
  showWeekLines: boolean;
  showMonthLines: boolean;
  dayLineColor: string;
  weekLineColor: string;
  monthLineColor: string;
  
  // Today line
  todayLineColor: string;
  todayLineWidth: number;
  todayLineStyle: 'solid' | 'dashed';
  showTodayHighlight: boolean; // Full column highlight
  
  // Spacing
  rowHeight: number;
  taskPadding: number;
  categoryGap: number; // Space between deliverable groups
}
```

### Implementation Tasks
- [ ] Add alternating row backgrounds
- [ ] Implement configurable grid lines
- [ ] Add category gap spacing
- [ ] Improve today line styling
- [ ] Add weekend highlighting option

---

## 7. Export to PDF/Image

### Goal
High-quality export for presentations and reports.

### Export Options
```typescript
interface ExportOptions {
  format: 'pdf' | 'png' | 'svg';
  quality: 'draft' | 'standard' | 'high';
  
  // Page settings (PDF)
  pageSize: 'A4' | 'A3' | 'Letter' | 'Custom';
  orientation: 'landscape' | 'portrait';
  margins: { top: number; right: number; bottom: number; left: number };
  
  // Content
  includeTitle: boolean;
  includeLegend: boolean;
  includeDateGenerated: boolean;
  includePageNumbers: boolean;
  
  // Fit options
  fitToPage: boolean;
  scale: number;
  
  // Date range
  exportRange: 'visible' | 'full' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
}
```

### Implementation Tasks
- [ ] Integrate html2canvas for image export
- [ ] Integrate jsPDF for PDF export
- [ ] Build export options modal
- [ ] Add legend generation
- [ ] Support multi-page PDF
- [ ] Add print stylesheet

---

## 8. Theme Presets

### Goal
Pre-built theme combinations for quick styling.

### Preset Themes
```typescript
const THEME_PRESETS = {
  corporate: {
    name: 'Corporate',
    headerBackground: '#1e3a5f',
    headerText: '#ffffff',
    primaryColour: '#3b82f6',
    accentColour: '#10b981',
    gridStyle: 'minimal'
  },
  academic: {
    name: 'Academic',
    headerBackground: '#7c3aed',
    headerText: '#ffffff', 
    primaryColour: '#8b5cf6',
    accentColour: '#06b6d4',
    gridStyle: 'detailed'
  },
  minimal: {
    name: 'Minimal',
    headerBackground: '#f8fafc',
    headerText: '#1e293b',
    primaryColour: '#64748b',
    accentColour: '#94a3b8',
    gridStyle: 'none'
  },
  vibrant: {
    name: 'Vibrant',
    headerBackground: '#ec4899',
    headerText: '#ffffff',
    primaryColour: '#f97316',
    accentColour: '#eab308',
    gridStyle: 'minimal'
  },
  dark: {
    name: 'Dark Mode',
    headerBackground: '#0f172a',
    headerText: '#f8fafc',
    primaryColour: '#3b82f6',
    accentColour: '#22d3ee',
    gridStyle: 'minimal',
    backgroundColour: '#1e293b'
  }
};
```

### Implementation Tasks
- [ ] Create preset definitions
- [ ] Build preset selector UI
- [ ] Implement "Apply Preset" functionality
- [ ] Allow saving custom presets
- [ ] Add preset preview thumbnails

---

## 🗓️ Implementation Phases

### Phase 1: Core Visual Polish (Week 1)
1. Fix timeline header (two-row with months + weeks)
2. Implement category color labels
3. Polish grid lines and spacing
4. Improve task bar styling

### Phase 2: Highlights & Breaks (Week 2)
1. Create highlight database model
2. Build highlight management UI
3. Implement highlight rendering
4. Add highlight labels

### Phase 3: Theme System (Week 3)
1. Extend theme settings
2. Build comprehensive theme panel
3. Create preset themes
4. Implement theme preview

### Phase 4: Export & Polish (Week 4)
1. Implement PNG/PDF export
2. Build export options modal
3. Final visual polish
4. Performance optimization

---

## 📁 New Files to Create

```
apps/web/
├── components/gantt/
│   ├── CategoryLabel.tsx        # Vertical category labels
│   ├── HighlightOverlay.tsx     # Period highlights
│   ├── HighlightLabel.tsx       # Highlight labels
│   ├── HighlightManager.tsx     # CRUD for highlights
│   ├── TimelineHeader.tsx       # Enhanced two-row header
│   ├── GridLayer.tsx            # Configurable grid
│   ├── ExportModal.tsx          # Export options
│   └── ThemePresets.tsx         # Preset selector
├── lib/gantt/
│   ├── themes.ts                # Theme presets
│   ├── export.ts                # Export utilities
│   └── highlights.ts            # Highlight utilities
└── server/domain/gantt/
    └── highlight.repo.ts        # Highlight CRUD
```

---

## 🎨 CSS/Styling Notes

### Rotated Category Labels
```css
.category-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  white-space: nowrap;
}
```

### Diagonal Stripe Pattern (for blocked tasks)
```css
.task-blocked {
  background: repeating-linear-gradient(
    45deg,
    var(--task-color),
    var(--task-color) 10px,
    var(--task-color-dark) 10px,
    var(--task-color-dark) 20px
  );
}
```

### Print Styles
```css
@media print {
  .gantt-toolbar,
  .gantt-sidebar-controls {
    display: none;
  }
  .gantt-canvas {
    overflow: visible !important;
  }
}
```

---

## Questions to Resolve

1. **Week numbering**: Start from project start or calendar year?
2. **Category labels**: Always visible or collapsible?
3. **Export**: Client-side only or server-side rendering for large charts?
4. **Highlights**: Per-project only or org-wide templates (e.g., company holidays)?
5. **Mobile**: How should the styled Gantt behave on smaller screens?

---

*This plan will transform the basic Gantt into a presentation-ready, highly customizable project visualization tool.*

