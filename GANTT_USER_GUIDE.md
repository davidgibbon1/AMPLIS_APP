# AMPLIS Gantt Module - User Guide

Welcome to the AMPLIS Gantt module! This guide will help you master the powerful scheduling and resource allocation features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Operations](#basic-operations)
3. [Resource Management](#resource-management)
4. [Theme Customization](#theme-customization)
5. [Advanced Features](#advanced-features)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Gantt View

1. Navigate to any project in AMPLIS
2. Click the **"Gantt View"** button in the project header
3. The Gantt chart will load with all deliverables and tasks

### Understanding the Interface

The Gantt view consists of four main areas:

- **Left Sidebar**: Hierarchical list of deliverables and tasks
- **Timeline Header**: Date/week/month markers with zoom controls
- **Canvas**: Visual timeline with draggable task bars
- **Toolbar**: Zoom controls, filters, and settings

---

## Basic Operations

### Viewing Tasks

**Sidebar View:**
- Deliverables are shown as collapsible sections
- Click the arrow (▼/▶) to expand/collapse deliverable tasks
- Each task shows: name, assigned resource, hours, cost, and status

**Timeline View:**
- Tasks appear as colored bars on the timeline
- Bar color indicates status:
  - Blue = In Progress
  - Green = Completed
  - Yellow = Under Review
  - Red = Blocked
  - Gray = Not Started

### Zoom Controls

Use the zoom controls in the toolbar to change the timeline granularity:

- **Day View**: See individual days (40px per day)
- **Week View**: See weeks (280px per week) - **Default**
- **Month View**: See months (~1200px per month)
- **Quarter View**: See quarters (~3600px per quarter)

**Quick Zoom:**
- Click the `+` button to zoom in
- Click the `-` button to zoom out
- Or click directly on Day/Week/Month/Quarter buttons

### Moving Tasks (Drag & Drop)

1. **Click and hold** on any task bar
2. **Drag horizontally** to change the start date
3. **Release** to save the new dates
4. The task maintains its duration while moving

**Snap to Grid:**
- Enable "Snap to Grid" in the toolbar for precise alignment
- Tasks will snap to the nearest day/week/month boundary based on zoom level
- Disable for free-form positioning

### Resizing Tasks

1. **Hover** over the right edge of a task bar
2. A resize handle appears
3. **Click and drag** the handle to change the end date
4. **Release** to save the new end date

### Selecting Tasks

- **Single Select**: Click on a task bar or sidebar item
- **Multi-Select**: Hold `Shift` and click multiple tasks
- **Deselect All**: Click on empty canvas area

---

## Resource Management

### Viewing Resource Capacity

1. Click the **"Resources"** button in the toolbar
2. The Resource Panel opens on the right
3. View capacity for all team members:
   - Allocated hours
   - Utilization percentage
   - Overload warnings (red)

**Utilization Color Coding:**
- 🔴 Red: Over 100% (overallocated)
- 🟡 Yellow: 80-100% (high utilization)
- 🟢 Green: 60-80% (optimal)
- ⚪ Gray: Under 60% (available capacity)

### Assigning Resources to Tasks

**Method 1: From Task Modal** (coming soon)
1. Double-click a task bar
2. In the modal, select "Assign Resource"
3. Choose a team member or custom resource
4. Enter allocated hours

**Method 2: From Sidebar**
1. Right-click a task in the sidebar
2. Select "Assign Resource"
3. Choose from the dropdown

### Creating Custom Resources

Custom resources are perfect for:
- External contractors
- Equipment rentals
- Third-party services
- Shared resources

**To Create:**
1. Open the Resource Panel
2. Scroll to "Custom Resources"
3. Click **"+ Add"**
4. Enter name and hourly rate
5. The resource is now available for assignment

### Understanding Capacity Warnings

⚠️ **Overload Warning:**
When a person is allocated over 100% capacity, they appear in red. This indicates:
- They have more work assigned than available hours
- Consider redistributing tasks
- Or adjust task timelines to reduce overlap

**Viewing Individual Utilization:**
Click on any team member in the Resource Panel to see:
- Weekly breakdown of allocations
- Which tasks they're assigned to
- Hours per task

---

## Theme Customization

Make your Gantt chart match your brand identity!

### Accessing Theme Settings

1. Click the **"Theme"** button in the toolbar
2. The Theme Panel opens on the right

### Color Customization

**Primary Color:**
- Used for active task bars (In Progress status)
- Default: Blue (#3b82f6)

**Accent Color:**
- Used for borders and highlights
- Default: Dark Blue (#1e40af)

**Background Color:**
- Canvas background color
- Default: Light Gray (#f8fafc)

**To Change Colors:**
1. Click the color picker square
2. Select a new color
3. Or paste a hex code directly
4. Changes preview in real-time

### Background Image

Add a branded background image to your Gantt canvas:

1. Enter an image URL in "Background Image"
2. Adjust **Blur** (0-100px) to soften the image
3. Adjust **Dim** (0-100%) to darken the image
4. This ensures task bars remain readable

**Best Practices:**
- Use light, low-contrast images
- Apply 20-40px blur for subtlety
- Apply 30-50% dim for text readability

### Company Logo Overlay

Display your company logo watermark:

1. Enter logo URL in "Logo URL"
2. Adjust **Opacity** (5-70%)
   - Lower = more subtle
   - Higher = more visible
3. Choose **Position**:
   - Bottom Right (default)
   - Bottom Left
   - Top Right
   - Top Left

**Recommended Settings:**
- Opacity: 20-40% for watermark effect
- Position: Bottom-right (least intrusive)

### Saving Themes

- **Project-Specific**: Theme applies only to this project
- **Org Default**: (Future) Apply theme to all projects
- Click **"Save Theme"** to apply changes
- Click **"Reset"** to restore defaults

---

## Advanced Features

### Task Dependencies (Coming Soon)

Link tasks to show relationships:
- Finish-to-Start: Task B starts when Task A finishes
- Start-to-Start: Tasks start together
- Finish-to-Finish: Tasks finish together

**Enable Dependencies:**
1. Click "Dependencies" in the toolbar
2. Arrows appear between dependent tasks
3. Critical path highlighted in red

### Filtering Tasks

**Show/Hide Completed:**
- Toggle to hide completed tasks
- Useful for focusing on active work

**Filter by Resource:**
- Select a team member to see only their tasks
- Great for individual workload views

**Filter by Deliverable:**
- Collapse/expand deliverables to focus

### Cost & Margin Tracking

Every task bar includes cost information:

**Hover Tooltip Shows:**
- Estimated hours vs. actual hours
- Estimated cost vs. actual cost
- Resource allocations and rates

**Cost Calculation:**
- Cost = Hours × Hourly Rate
- Rolls up to deliverable level
- Rolls up to project level

**Color Indicators:**
- Tasks turn red if actual cost > estimated
- Margin warnings if profit eroding

### Task History & Audit Trail

Every change is tracked:
- Who moved the task
- When it was moved
- Original vs. new dates
- Status changes
- Resource assignments

**Viewing History:**
1. Right-click a task
2. Select "View History"
3. See complete audit log
4. Revert to previous version if needed

### Exporting Timeline

**Export Options:**
- PDF: Print-ready Gantt chart
- PNG: High-resolution image
- Shareable Link: Public read-only view

**To Export:**
1. Click **"Export"** in toolbar
2. Choose format
3. Configure options (date range, resources, financials)
4. Download or copy link

---

## Keyboard Shortcuts

### Navigation
- `Arrow Keys`: Scroll timeline
- `Ctrl/Cmd + Mouse Wheel`: Horizontal scroll
- `Space + Drag`: Pan canvas

### Zoom
- `Ctrl/Cmd + +`: Zoom in
- `Ctrl/Cmd + -`: Zoom out
- `Ctrl/Cmd + 0`: Reset zoom

### Selection
- `Shift + Click`: Multi-select tasks
- `Ctrl/Cmd + A`: Select all tasks
- `Escape`: Clear selection

### Editing
- `Double-Click`: Open task modal
- `Delete`: Delete selected task(s)
- `Ctrl/Cmd + D`: Duplicate task
- `Ctrl/Cmd + Z`: Undo last change

### Views
- `G`: Toggle grid
- `D`: Toggle dependencies
- `R`: Open resource panel
- `T`: Open theme panel

---

## Best Practices

### 1. Start with Deliverables

Before creating tasks in the Gantt:
1. Define all deliverables in the project
2. Estimate deliverable durations
3. Then break into tasks

### 2. Set Realistic Task Durations

- Use historical data when available
- Account for dependencies and blockers
- Add buffer time (10-20%) for unknowns

### 3. Assign Resources Early

- Assign people as soon as tasks are defined
- Check resource capacity regularly
- Avoid overallocation

### 4. Update Regularly

- Log actual hours weekly
- Move tasks as dates shift
- Update status as work progresses

### 5. Use Custom Resources for Contractors

- Create custom resources for external help
- Set accurate hourly rates
- Track contractor costs separately

### 6. Monitor Utilization

- Aim for 60-80% utilization (optimal)
- Under 60% = underutilized
- Over 100% = burnout risk

### 7. Theme for Client Presentations

- Set up custom theme with client's brand colors
- Add client logo (low opacity)
- Export as PDF for client review

### 8. Version Control via History

- Before major changes, note the current state
- Use task history to revert if needed
- Compare versions to show progress

---

## Troubleshooting

### Task Won't Move

**Possible Causes:**
- Task is linked with dependencies (check for arrows)
- You don't have edit permissions
- Task is locked (completed status)

**Solution:**
- Remove dependencies first
- Check project permissions
- Change status to "In Progress"

### Resource Shows Overallocated but Isn't

**Possible Causes:**
- Overlapping task dates
- Tasks allocated at 100% (no room for meetings, breaks)
- Old allocations not removed

**Solution:**
- Stagger task dates to reduce overlap
- Allocate at 70-80% (accounts for non-project work)
- Remove outdated resource assignments

### Theme Not Saving

**Possible Causes:**
- Network error
- Browser cache issue
- Invalid color hex codes

**Solution:**
- Check browser console for errors
- Try refreshing the page
- Use valid hex codes (#RRGGBB format)

### Gantt Not Loading

**Possible Causes:**
- Project has no deliverables
- Browser compatibility issue
- Large project (500+ tasks)

**Solution:**
- Create at least one deliverable
- Use latest Chrome/Firefox/Safari
- For large projects, filter or zoom out

### Task Bar Not Visible

**Possible Causes:**
- Task dates outside timeline range
- Task collapsed under deliverable
- Filter hiding the task

**Solution:**
- Expand deliverable in sidebar
- Adjust zoom level
- Clear filters

---

## Support & Feedback

### Getting Help

- **Documentation**: Check this guide first
- **Video Tutorials**: [Link to video library]
- **Support Email**: support@amplis.app
- **Community Forum**: [Link to forum]

### Reporting Bugs

If you encounter a bug:
1. Note what you were doing when it occurred
2. Take a screenshot if applicable
3. Email support with:
   - Project ID
   - Steps to reproduce
   - Expected vs. actual behavior

### Feature Requests

We love feedback! To request a feature:
1. Check if it's already planned in the roadmap
2. Submit via the feedback form
3. Vote on existing requests in the community forum

---

## What's Next?

### Upcoming Features

**Q1 2025:**
- ✅ Full drag-and-drop task scheduling
- ✅ Resource capacity engine
- ✅ Theme customization
- ✅ Cost & margin tracking

**Q2 2025:**
- 🔄 Task dependencies & critical path
- 🔄 Google Calendar sync
- 🔄 AI scheduling assistant
- 🔄 Real-time collaboration

**Q3 2025:**
- ⏳ Mobile app with Gantt view
- ⏳ Excel/MS Project import
- ⏳ Gantt templates library
- ⏳ Client portal access

**Q4 2025:**
- ⏳ Advanced reporting & analytics
- ⏳ Budget alerts & notifications
- ⏳ Resource booking system
- ⏳ Slack/Teams integration

### Learning Resources

- **Quick Start Video**: 5-minute intro to Gantt basics
- **Deep Dive Webinar**: 30-minute comprehensive training
- **Use Case Library**: Real examples from consultancies
- **Best Practices Guide**: Advanced tips from power users

---

## Quick Reference Card

### Common Actions

| Action | Method |
|--------|--------|
| Move task | Drag task bar left/right |
| Resize task | Drag right edge of task bar |
| Zoom in/out | Use +/- buttons or click zoom level |
| Assign resource | Right-click task → Assign Resource |
| View capacity | Click "Resources" button |
| Change theme | Click "Theme" button |
| Export timeline | Click "Export" button |
| Create task | Click "+ New Task" |
| View task details | Double-click task bar |
| Select multiple | Shift + click tasks |

### Status Colors

| Status | Color |
|--------|-------|
| Not Started | Gray |
| In Progress | Blue |
| Under Review | Yellow |
| Blocked | Red |
| Completed | Green |

### Utilization Zones

| Zone | Utilization | Meaning |
|------|-------------|---------|
| 🟢 Green | 60-80% | Optimal |
| 🟡 Yellow | 80-100% | High |
| 🔴 Red | >100% | Overallocated |
| ⚪ Gray | <60% | Available |

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Author**: AMPLIS Product Team

For the latest version of this guide, visit: [docs.amplis.app/gantt](https://docs.amplis.app/gantt)






