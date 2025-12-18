# AMPLIS Gantt Module - Full Implementation Plan

## Overview
This document outlines the complete implementation plan for the AMPLIS Gantt module - a world-class project scheduling, resource allocation, and capacity planning tool.

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js App Router, React Flow (Gantt rendering), Zustand (state), TailwindCSS
- **Backend**: TRPC, Prisma ORM, Supabase (Postgres + Realtime)
- **State Management**: Zustand for Gantt canvas state, TanStack Query for server state
- **Real-time**: Supabase Realtime channels per project
- **AI**: OpenAI integration for scheduling assistance
- **Calendar**: Google Calendar API OAuth integration

## Database Schema Extensions

### New Models

#### 1. Task
```prisma
model Task {
  id              String   @id @default(cuid())
  deliverableId   String
  projectId       String   // Denormalized for easy querying
  
  name            String
  description     String?
  status          TaskStatus @default(NOT_STARTED)
  
  // Scheduling
  startDate       DateTime
  endDate         DateTime
  estimatedHours  Decimal  @default(0)
  actualHours     Decimal  @default(0)
  
  // Costing
  costEstimated   Decimal  @default(0)
  costActual      Decimal  @default(0)
  
  // Visual
  colour          String?  // Override theme color
  sortOrder       Int      @default(0)
  
  // Dependencies
  dependsOn       String[] // Array of task IDs
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  deliverable     Deliverable   @relation(fields: [deliverableId], references: [id], onDelete: Cascade)
  project         Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  resources       TaskResource[]
  history         TaskHistory[]
}

enum TaskStatus {
  NOT_STARTED
  IN_PROGRESS
  BLOCKED
  UNDER_REVIEW
  COMPLETED
}
```

#### 2. TaskResource (Assignment)
```prisma
model TaskResource {
  id              String   @id @default(cuid())
  taskId          String
  
  // Can be either a Person OR a CustomResource
  personId        String?
  customResourceId String?
  
  allocatedHours  Decimal  @default(0)
  actualHours     Decimal  @default(0)
  hourlyRate      Decimal  @default(0) // Captured at assignment time
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  task            Task              @relation(fields: [taskId], references: [id], onDelete: Cascade)
  person          Person?           @relation(fields: [personId], references: [id])
  customResource  CustomResource?   @relation(fields: [customResourceId], references: [id])
}
```

#### 3. CustomResource
```prisma
model CustomResource {
  id          String   @id @default(cuid())
  orgId       String
  name        String
  hourlyRate  Decimal  @default(0)
  description String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  org         Org           @relation(fields: [orgId], references: [id], onDelete: Cascade)
  assignments TaskResource[]
}
```

#### 4. TaskHistory (Audit Trail)
```prisma
model TaskHistory {
  id          String   @id @default(cuid())
  taskId      String
  userId      String
  
  action      TaskHistoryAction
  fieldName   String?  // e.g., "startDate", "assignedResource"
  oldValue    Json?
  newValue    Json?
  
  createdAt   DateTime @default(now())
  
  // Relations
  task        Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user        User @relation(fields: [userId], references: [id])
  
  @@index([taskId, createdAt])
}

enum TaskHistoryAction {
  CREATED
  UPDATED
  DELETED
  MOVED
  RESIZED
  RESOURCE_ASSIGNED
  RESOURCE_REMOVED
  STATUS_CHANGED
}
```

#### 5. ThemeSettings
```prisma
model ThemeSettings {
  id                String   @id @default(cuid())
  projectId         String?  // If null, it's the org default
  orgId             String
  
  primaryColour     String   @default("#3b82f6")
  accentColour      String   @default("#1e40af")
  backgroundColour  String   @default("#f8fafc")
  backgroundImageUrl String?
  backgroundBlur    Int      @default(0) // 0-100
  backgroundDim     Int      @default(0) // 0-100
  
  logoUrl           String?
  logoOpacity       Int      @default(30) // 5-70
  logoPosition      String   @default("bottom-right")
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  org               Org      @relation(fields: [orgId], references: [id], onDelete: Cascade)
  project           Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([orgId, projectId])
}
```

#### 6. UserPreferences (Zoom level, view mode)
```prisma
model UserPreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique
  
  ganttZoomLevel        String   @default("week") // day, week, month, quarter
  ganttSnapToGrid       Boolean  @default(true)
  ganttShowDependencies Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Implementation Phases

### Phase 1: Foundation (Database & Core Services)
**Goal**: Set up data models and basic CRUD operations

#### Steps:
1. ✅ Update Prisma schema with all new models
2. ✅ Run migration to add new tables
3. ✅ Create Gantt domain layer:
   - `gantt.schema.ts` (Zod schemas)
   - `gantt.repo.ts` (Prisma queries)
   - `gantt.service.ts` (business logic)
4. ✅ Create TRPC routers:
   - `task.ts` router
   - `resource.ts` router
   - `theme.ts` router

### Phase 2: Frontend Canvas (React Flow)
**Goal**: Build interactive Gantt chart with drag & drop

#### Steps:
1. ✅ Install dependencies: `reactflow`, `date-fns`, `zustand`
2. ✅ Create Zustand store for Gantt state
3. ✅ Build core components:
   - `GanttCanvas.tsx` (React Flow wrapper)
   - `TaskBar.tsx` (draggable task blocks)
   - `Timeline.tsx` (date headers)
   - `TaskSidebar.tsx` (left panel with tree)
4. ✅ Implement drag-and-drop handlers
5. ✅ Add resize handlers
6. ✅ Snap-to-grid logic

### Phase 3: Resource Management
**Goal**: Assign resources and track capacity

#### Steps:
1. ✅ Resource dropdown in task form
2. ✅ Custom resource modal
3. ✅ Capacity calculation service
4. ✅ Overload warnings UI
5. ✅ Weekly utilization view

### Phase 4: Theming & Branding
**Goal**: Customizable visual appearance

#### Steps:
1. ✅ Theme settings panel
2. ✅ Color picker integration
3. ✅ Background image upload
4. ✅ Logo upload with positioning
5. ✅ Real-time theme preview

### Phase 5: Cost & Margin Tracking
**Goal**: Financial visibility per task/deliverable

#### Steps:
1. ✅ Cost calculation logic
2. ✅ Margin rollup to deliverable/project
3. ✅ Cost variance alerts
4. ✅ Financial summary cards

### Phase 6: Real-time Collaboration
**Goal**: Multi-user editing with live updates

#### Steps:
1. ✅ Supabase Realtime channel setup
2. ✅ Broadcast task changes
3. ✅ Presence indicators
4. ✅ Conflict resolution (optimistic locking)

### Phase 7: Google Calendar Sync
**Goal**: Bi-directional calendar integration

#### Steps:
1. ✅ OAuth flow for Google Calendar
2. ✅ Sync service (task → event, event → task)
3. ✅ Periodic sync cron job
4. ✅ Per-resource toggle for sync

### Phase 8: AI Scheduling Assistant
**Goal**: Intelligent scheduling suggestions

#### Steps:
1. ✅ AI service integration
2. ✅ Autofill task durations
3. ✅ Resource allocation suggestions
4. ✅ Conflict detection & resolution
5. ✅ Timeline optimization suggestions

### Phase 9: Advanced Features
**Goal**: Power user features

#### Steps:
1. ✅ Dependency arrows
2. ✅ Critical path calculation
3. ✅ Version history & rollback
4. ✅ Timeline export (PDF, PNG)
5. ✅ Shareable links
6. ✅ Scenario planning (what-if mode)

## API Endpoints (TRPC)

### Task Router
```typescript
task.list({ projectId, deliverableId? })
task.get({ id })
task.create({ deliverableId, data })
task.update({ id, data })
task.delete({ id })
task.move({ id, startDate, endDate })
task.resize({ id, endDate })
task.updateStatus({ id, status })
task.history({ id })
task.revert({ id, historyId })
```

### Resource Router
```typescript
resource.assign({ taskId, personId?, customResourceId? })
resource.remove({ taskResourceId })
resource.capacity({ orgId, startDate, endDate })
resource.utilization({ personId, startDate, endDate })
resource.createCustom({ orgId, data })
```

### Theme Router
```typescript
theme.get({ projectId?, orgId })
theme.update({ projectId?, orgId, data })
theme.uploadBackground({ projectId?, orgId, file })
theme.uploadLogo({ projectId?, orgId, file })
theme.generateFromBrand({ logoUrl }) // AI-powered
```

### Gantt Router
```typescript
gantt.getFullView({ projectId }) // Returns project + deliverables + tasks + resources
gantt.exportPDF({ projectId, options })
gantt.exportPNG({ projectId, options })
gantt.shareableLink({ projectId, expiresIn? })
```

### AI Router
```typescript
ai.suggestSchedule({ projectId, deliverableIds })
ai.detectConflicts({ projectId })
ai.optimizeTimeline({ projectId, constraints })
ai.suggestResources({ taskId })
```

## UI Components Structure

```
/apps/web/app/(dashboard)/projects/[id]/gantt/
  page.tsx                          # Main Gantt page
  
/apps/web/components/gantt/
  GanttCanvas.tsx                   # React Flow container
  TaskBar.tsx                       # Individual task block
  Timeline.tsx                      # Date header
  TaskSidebar.tsx                   # Left tree view
  ResourcePanel.tsx                 # Resource picker
  ThemePanel.tsx                    # Theme customization
  CapacityWidget.tsx                # Resource capacity view
  DependencyArrow.tsx               # Task dependencies
  ExportMenu.tsx                    # Export options
  AIAssistant.tsx                   # AI suggestions panel
  
/apps/web/lib/gantt/
  store.ts                          # Zustand store
  utils.ts                          # Date/snap utilities
  types.ts                          # TypeScript types
  constants.ts                      # Grid sizes, colors
```

## Key Features Checklist

### Core Functionality
- [x] Drag tasks horizontally to reschedule
- [x] Resize tasks from edges
- [x] Double-click to open task modal
- [x] Create task by dragging on empty space
- [x] Snap-to-grid (configurable)
- [x] Zoom levels (day/week/month/quarter)
- [x] Sticky timeline header
- [x] Horizontal scroll support

### Resource Management
- [x] Assign org members to tasks
- [x] Create custom resources
- [x] View resource capacity
- [x] Overload warnings
- [x] Utilization forecasting
- [x] Weekly load visualization

### Financial Tracking
- [x] Task-level cost calculation
- [x] Deliverable cost rollup
- [x] Project margin visibility
- [x] Cost variance alerts
- [x] Hourly rate capture

### Visual Customization
- [x] Theme color customization
- [x] Background image upload
- [x] Logo overlay
- [x] Per-task color override
- [x] Dark/light mode

### Collaboration
- [x] Real-time updates via Supabase
- [x] Presence indicators
- [x] Audit trail for all changes
- [x] Version history
- [x] Rollback capability

### Integrations
- [x] Google Calendar sync (OAuth)
- [x] Push tasks to calendar
- [x] Pull calendar events
- [x] Per-resource sync toggle

### AI Features
- [x] Auto-estimate task duration
- [x] Suggest resource allocation
- [x] Detect scheduling conflicts
- [x] Optimize timeline
- [x] Auto-build Gantt from deliverables

### Advanced
- [x] Task dependencies
- [x] Critical path detection
- [x] Export to PDF/PNG
- [x] Shareable links
- [x] Scenario planning mode
- [x] Timeline heatmaps
- [x] Multi-project overlay

## Performance Considerations

### Optimization Strategies
1. **Virtualization**: Use React Flow's built-in virtualization for large task lists
2. **Debouncing**: Debounce drag/resize events before syncing to server
3. **Optimistic Updates**: Update UI immediately, sync in background
4. **Caching**: Cache resource capacity calculations in materialized view
5. **Lazy Loading**: Load tasks on-demand as user scrolls
6. **Web Workers**: Use workers for heavy calculations (critical path, conflicts)

### Scalability
- Handle projects with 500+ tasks smoothly
- Support 50+ simultaneous users per project
- Real-time updates with <100ms latency
- PDF export for timelines up to 2 years

## Security Considerations

### Access Control
- All Gantt operations respect org-level permissions
- Project-specific access controls
- Audit all task changes
- Prevent resource conflicts via optimistic locking

### Data Validation
- Validate date ranges (start < end)
- Validate resource availability
- Validate cost calculations
- Sanitize theme uploads (image types, size limits)

## Testing Strategy

### Unit Tests
- Task service logic
- Resource capacity calculations
- Cost rollup algorithms
- Dependency resolution

### Integration Tests
- TRPC routers
- Database operations
- Real-time sync

### E2E Tests (Playwright)
- Create/edit/delete tasks
- Drag & drop scheduling
- Resource assignment
- Theme customization
- Export functionality

## Deployment Checklist

- [ ] Run Prisma migration
- [ ] Seed test data
- [ ] Configure Google OAuth credentials
- [ ] Set up Supabase Realtime policies
- [ ] Configure file upload storage (S3/R2)
- [ ] Set up OpenAI API key
- [ ] Enable error monitoring (Sentry)
- [ ] Set up analytics tracking
- [ ] Create user documentation
- [ ] Record demo video

## Documentation Deliverables

1. **User Guide**: How to use the Gantt module
2. **Admin Guide**: Theme customization, settings
3. **Developer Guide**: Architecture, extending features
4. **API Reference**: All TRPC endpoints
5. **Video Tutorials**: 
   - Getting started
   - Resource allocation
   - Theme customization
   - Google Calendar sync
   - AI assistant usage

## Success Metrics

### User Adoption
- % of projects using Gantt view
- Average time spent in Gantt view
- Tasks created per project

### Efficiency Gains
- Reduction in scheduling conflicts
- Improvement in resource utilization
- Decrease in project overruns

### Financial Impact
- Better margin tracking accuracy
- Faster invoicing cycles
- Improved cost forecasting

## Future Enhancements (Post-Launch)

1. **Mobile App**: Native iOS/Android Gantt view
2. **Excel Import/Export**: Bulk task import
3. **Microsoft Project Integration**: Import .mpp files
4. **Jira Integration**: Sync with Jira tickets
5. **Slack Notifications**: Task updates via Slack
6. **Public API**: Allow third-party integrations
7. **Gantt Templates**: Reusable project templates
8. **Resource Booking**: Reserve resources in advance
9. **Budget Alerts**: Real-time budget burn alerts
10. **Client Portal**: Share Gantt view with clients

---

## Implementation Timeline

**Phase 1-2**: 2 weeks (Foundation + Canvas)
**Phase 3-4**: 1 week (Resources + Theming)
**Phase 5-6**: 1 week (Costing + Real-time)
**Phase 7-8**: 2 weeks (Calendar + AI)
**Phase 9**: 1 week (Advanced features)

**Total**: ~7 weeks for full implementation

---

*This document will be updated as implementation progresses.*





