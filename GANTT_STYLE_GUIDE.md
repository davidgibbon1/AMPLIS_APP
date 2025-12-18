# Gantt Chart Style Guide

## Visual Design Specifications

This document describes the visual style of the Gantt chart, inspired by professional PowerPoint-style Gantt charts.

## Color Palette

### Deliverable Colors
The following 10 distinct colors are used to differentiate deliverables:

| Color Name | Hex Code  | RGB               | Usage                          |
|-----------|-----------|-------------------|--------------------------------|
| Blue      | `#3B82F6` | rgb(59, 130, 246) | Primary deliverables          |
| Green     | `#10B981` | rgb(16, 185, 129) | Completed/successful phases    |
| Amber     | `#F59E0B` | rgb(245, 158, 11) | In-progress items             |
| Red       | `#EF4444` | rgb(239, 68, 68)  | Critical path items           |
| Purple    | `#8B5CF6` | rgb(139, 92, 246) | Research/planning phases      |
| Pink      | `#EC4899` | rgb(236, 72, 153) | Design/creative work          |
| Cyan      | `#06B6D4` | rgb(6, 182, 212)  | Development sprints           |
| Orange    | `#F97316` | rgb(249, 115, 22) | Testing/QA phases             |
| Indigo    | `#6366F1` | rgb(99, 102, 241) | Integration work              |
| Teal      | `#14B8A6` | rgb(20, 184, 166) | Deployment/operations         |

### System Colors
- **Today Line**: `#EF4444` (Red) - High visibility
- **Grid Lines**: `#F1F5F9` (Slate-100) - Subtle background
- **Selected Tasks**: `#2563EB` (Blue-600) ring
- **Hover State**: Shadow elevation

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Top Navigation Bar (14px height)                              │
│  [Back to Project]                           [+ New Task]      │
├─────────────────────────────────────────────────────────────────┤
│  Toolbar (14px height)                                         │
│  Project Name | Gantt View     [Zoom Controls]    [Actions]   │
├──────────────┬──────────────────────────────────────────────────┤
│              │  Timeline Header (60px height)                  │
│              │  [Month/Week/Day Labels]      [Today]           │
│  Sidebar     ├──────────────────────────────────────────────────┤
│  (400px)     │                                                  │
│              │  Canvas Area                                     │
│  Deliverable │  ┃ ← Today line (red)                           │
│    Color ●   │  ┃                                               │
│    Tasks     │  ┃ [Task Bars]                                  │
│              │  ┃                                               │
│              │  ┃                                               │
└──────────────┴──────────────────────────────────────────────────┤
│  Footer Stats (40px height)                                    │
│  3 deliverables • 12 tasks • 5 completed                       │
└─────────────────────────────────────────────────────────────────┘
```

## Component Dimensions

### Sidebar
- **Width**: 400px (configurable)
- **Deliverable Row Height**: 48px
- **Task Row Height**: 48px
- **Color Indicator**: 20x20px rounded square
- **Color Picker Grid**: 4 columns, 32x32px squares

### Timeline
- **Header Height**: 60px
- **Label Padding**: 12px horizontal, 8px vertical
- **Font Sizes**: 
  - Primary label: 14px (font-medium)
  - Secondary label: 12px (text-slate-500)

### Task Bars
- **Height**: 32px (ROW_HEIGHT - 16px)
- **Vertical Margin**: 8px (top and bottom)
- **Minimum Width**: 40px
- **Border Radius**: 6px (rounded-md)
- **Progress Bar**: White overlay at 20% opacity

### Today Line
- **Width**: 2px (w-0.5 in Tailwind)
- **Color**: Red (#EF4444)
- **Z-index**: 20 (above canvas content)
- **Badge**: 
  - Font size: 12px
  - Padding: 2px 8px
  - Background: Red (#EF4444)
  - Text: White

## Zoom Levels & Scale

### Day View
- **Pixels per Day**: 40px
- **Label Format**: "MMM d" (e.g., "Jan 15")
- **Sub-label**: Day of week (e.g., "Mon")
- **Best for**: Detailed task planning (1-4 weeks)

### Week View (Default)
- **Pixels per Week**: 280px (40 * 7)
- **Label Format**: "MMM d" (week start)
- **Sub-label**: "Week N"
- **Best for**: Sprint planning (1-3 months)

### Month View
- **Pixels per Month**: 1200px (~40 * 30)
- **Label Format**: "MMM yyyy" (e.g., "Jan 2024")
- **Best for**: Project overview (3-12 months)

### Quarter View
- **Pixels per Quarter**: 3600px (~40 * 90)
- **Label Format**: "Q1 2024"
- **Best for**: Long-term roadmaps (1-2 years)

## Interaction States

### Task Bars
1. **Default**: Solid deliverable color with subtle shadow
2. **Hover**: Elevated shadow, tooltip appears
3. **Selected**: Blue ring (2px) with 2px offset
4. **Dragging**: 70% opacity, cursor changes
5. **Resizing**: Right edge handle visible on hover (30% white)

### Deliverable Headers
1. **Default**: Light gray background (slate-100)
2. **Hover**: Darker gray (slate-200)
3. **Color Picker Active**: Popover shown with color grid

### Color Picker
1. **Closed**: Color square shows deliverable color
2. **Hover**: Palette icon overlays (white with drop shadow)
3. **Open**: 4x3 grid of color swatches
4. **Swatch Hover**: 10% scale increase, darker border

## Typography

### Font Stack
- **Primary**: System UI fonts (Next.js default)
- **Monospace**: For dates and numbers (optional)

### Sizes
- **Project Title**: 18px (text-lg, font-semibold)
- **Deliverable Names**: 14px (font-semibold)
- **Task Names**: 14px (font-medium)
- **Metadata**: 12px (text-xs)
- **Timeline Labels**: 14px primary, 12px secondary

### Colors (Text)
- **Primary**: Slate-900 (#0F172A)
- **Secondary**: Slate-600 (#475569)
- **Muted**: Slate-500 (#64748B)
- **Today Highlight**: Red-600 (#DC2626)

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Color is not the only indicator (status badges included)
- Hover states provide clear feedback

### Keyboard Navigation
- Tab through interactive elements
- Enter to open/close menus
- Escape to close popover
- Arrow keys for navigation (future enhancement)

### Screen Readers
- Semantic HTML structure
- ARIA labels for interactive elements
- Alt text for visual indicators

## Responsive Behavior

### Desktop (> 1024px)
- Full sidebar visible (400px)
- All toolbar actions visible
- Optimal for detailed work

### Tablet (768px - 1024px)
- Sidebar collapsible
- Zoom controls remain accessible
- Canvas scrolls horizontally

### Mobile (< 768px)
- Sidebar becomes drawer
- Simplified toolbar
- Touch-optimized interactions

## Performance Considerations

### Rendering
- Virtual scrolling for 100+ tasks
- Debounced drag updates
- Optimized re-renders with React.memo

### Data Loading
- Lazy load task history
- Paginated resource lists
- Cached theme settings

## Professional Gantt Best Practices

### Visual Hierarchy
1. **Deliverables** stand out with color and size
2. **Tasks** are clearly grouped under deliverables
3. **Today line** is the most prominent vertical element
4. **Critical path** can be highlighted with red color

### Timeline Clarity
- Clear date labels at appropriate intervals
- Week numbers for context in week view
- Quarter markers for long-term planning

### Color Usage
- Maximum 10 active deliverables visible
- Distinct hues avoid confusion
- Consistent color meaning across views

### Information Density
- Balance between detail and overview
- Zoom levels for different perspectives
- Tooltips for detailed information
- Status badges for quick scanning

## Comparison to PowerPoint Gantt Charts

### Similar Features
✅ Color-coded deliverables
✅ Horizontal bar chart layout
✅ Timeline with date labels
✅ Today indicator
✅ Task grouping by deliverable

### Enhanced Features
🎯 Interactive color picker
🎯 Real-time drag-and-drop
🎯 Multiple zoom levels
🎯 Progress tracking within bars
🎯 Resource allocation indicators
🎯 Status badges
🎯 Hover tooltips with details

### Future PowerPoint Export
- Preserve colors in export
- Match layout exactly
- Include today line
- Professional formatting

