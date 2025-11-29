# Organization Levels & Hierarchy Feature

## Overview
This implementation adds comprehensive organization management capabilities to AMPLIS, including:
- Custom organization levels (e.g., Consultant, Senior Consultant, Analyst)
- Manager-report hierarchy with visual representation
- Admin role management
- Intuitive UI inspired by Supabase/n8n for viewing org connections

## 🎯 Features Implemented

### 1. **Organization Levels**
- Create custom org levels specific to your consulting firm
- Assign people to different levels
- Track how many people are at each level
- Delete levels (people get unassigned automatically)

### 2. **Organizational Hierarchy**
- Manager-report relationships
- Visual hierarchy view showing reporting structure
- Circular reference prevention
- Automatic handling when managers are deleted

### 3. **Admin Management**
- Separate admin roles from org levels
- Role-based access control (RBAC):
  - **OWNER**: Full control, can create other owners
  - **ADMIN**: Manage org levels, users, and settings
  - **MANAGER**: Manage projects, people, allocations
  - **MEMBER**: View and contribute to projects
- Admins can promote other users to admin
- Only owners can create other owners

### 4. **People Management**
- Add people to the organization
- Assign org level and manager
- Track cost rate and bill rate
- Link people to auth users (optional)
- View people in list or hierarchy mode

## 📁 Files Created

### Backend (Domain Layer)
```
apps/web/server/domain/org/
├── org.schema.ts      # Zod validation schemas
├── org.repo.ts        # Database queries (Prisma)
└── org.service.ts     # Business logic
```

### API Layer
```
apps/web/server/trpc/routers/
└── org.ts            # tRPC endpoints for org management
```

### Frontend (UI)
```
apps/web/app/(dashboard)/
├── people/
│   └── page.tsx      # People & organization page
└── admin/
    └── page.tsx      # Admin management page
```

### Database
```
apps/web/prisma/
├── schema.prisma     # Updated with OrgLevel model
└── migrations/
    └── add_org_levels_and_hierarchy.sql
```

## 🗄️ Database Schema Changes

### New Model: OrgLevel
```prisma
model OrgLevel {
  id          String   @id @default(cuid())
  orgId       String
  name        String   // e.g. "Consultant", "Senior Consultant"
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  org         Org      @relation(fields: [orgId], references: [id])
  people      Person[]
  
  @@unique([orgId, name])
}
```

### Updated Model: Person
```prisma
model Person {
  // ... existing fields
  orgLevelId  String?  // NEW: Link to OrgLevel
  managerId   String?  // NEW: Self-referencing for hierarchy
  
  // NEW Relations
  orgLevel    OrgLevel?    @relation(fields: [orgLevelId], references: [id])
  manager     Person?      @relation("PersonHierarchy", fields: [managerId], references: [id])
  reports     Person[]     @relation("PersonHierarchy")
}
```

## 🔌 API Endpoints (tRPC)

### Organization Levels
- `org.listOrgLevels` - Get all org levels
- `org.getOrgLevel` - Get single org level with people
- `org.createOrgLevel` - Create new org level (Admin only)
- `org.updateOrgLevel` - Update org level (Admin only)
- `org.deleteOrgLevel` - Delete org level (Admin only)

### People
- `org.listPeople` - Get all people with hierarchy info
- `org.getPerson` - Get single person details
- `org.createPerson` - Add new person (Manager+)
- `org.updatePerson` - Update person (Manager+)
- `org.deletePerson` - Delete person (Manager+)
- `org.getOrgHierarchy` - Get full org hierarchy tree

### Admin/Roles
- `org.listOrgUsers` - Get all users in org (Admin only)
- `org.updateUserRole` - Change user role (Admin only)

## 🎨 UI Features

### People Page (`/people`)

#### Stats Dashboard
- Total people count
- Number of org levels
- Number of managers
- Unassigned people count

#### View Modes
1. **Hierarchy View**
   - Tree structure showing reporting lines
   - Expandable/collapsible nodes
   - Visual badges for org levels
   - Shows number of direct reports
   - Supabase/n8n inspired design

2. **List View**
   - Tabular view of all people
   - Shows: Name, Email, Level, Manager, Reports, Rates
   - Inline edit and delete actions

#### Filters
- Search by name or email
- Filter by org level
- Real-time filtering

#### Actions
- Add new person
- Manage org levels
- Edit person details
- Delete person

### Admin Page (`/admin`)

#### Role Management
- Visual role cards with descriptions
- List all users with current roles
- Change user roles via dropdown
- Color-coded role badges
- Permission notes and guidelines

## 🔒 Security & Permissions

### Role Hierarchy
```
OWNER > ADMIN > MANAGER > MEMBER
```

### Permissions Matrix
| Action | Owner | Admin | Manager | Member |
|--------|-------|-------|---------|--------|
| Create org levels | ✅ | ✅ | ❌ | ❌ |
| Manage people | ✅ | ✅ | ✅ | ❌ |
| View hierarchy | ✅ | ✅ | ✅ | ✅ |
| Manage user roles | ✅ | ✅ | ❌ | ❌ |
| Create owners | ✅ | ❌ | ❌ | ❌ |

## 🚀 Getting Started

### 1. Run Migration
```bash
cd apps/web
# Apply the migration to your Supabase database
psql $DATABASE_URL -f prisma/migrations/add_org_levels_and_hierarchy.sql

# Or regenerate Prisma client
npx prisma generate
```

### 2. Verify Admin User
The migration automatically makes `davidgibbon24@gmail.com` an admin. You can verify by checking the `UserOrgRole` table.

### 3. Access the Features
- Navigate to `/people` to manage organization structure
- Navigate to `/admin` to manage user roles
- Start by creating org levels, then add people

## 📊 Usage Examples

### Creating Organization Levels
1. Go to `/people`
2. Click "Manage Levels"
3. Click "Add New Level"
4. Enter name (e.g., "Senior Consultant")
5. Optionally add description and order
6. Click "Create Level"

### Adding People
1. Go to `/people`
2. Click "Add Person"
3. Fill in details:
   - Name (required)
   - Email (optional)
   - Org Level (optional)
   - Manager (optional)
   - Cost and bill rates
4. Click "Create Person"

### Setting Up Hierarchy
1. Create your leadership team first (no manager)
2. Add team members and assign them to managers
3. Switch to "Hierarchy" view to see the org chart
4. System prevents circular references automatically

### Managing Admins
1. Go to `/admin` (requires admin access)
2. Find the user you want to promote
3. Select their new role from the dropdown
4. Changes take effect immediately

## 🎯 Design Decisions

### Why Separate Admin from Org Levels?
- Admin roles control **system permissions**
- Org levels represent **business hierarchy**
- Example: A "Junior Analyst" (org level) can be an "Admin" (system role)
- This separation provides flexibility for consulting firms

### Hierarchy View Design
- Inspired by Supabase's relationship diagrams
- Tree structure is more intuitive than flat lists
- Expandable nodes reduce clutter
- Color coding helps identify levels quickly

### Circular Reference Prevention
- Service layer checks for circular manager relationships
- Prevents A→B→C→A scenarios
- User-friendly error messages
- Maintains data integrity

## 🔄 Migration Notes

### Existing Data
- Existing `Person` records won't have `orgLevelId` or `managerId`
- They will show as "unassigned" in the UI
- You can gradually assign them to levels and managers

### Admin Setup
- The migration makes `davidgibbon24@gmail.com` an admin
- If the user doesn't exist yet, the migration will skip this step
- You can manually update roles in the database or use the UI

## 🐛 Troubleshooting

### People not showing up?
- Check that you're in the correct org context
- Verify RLS policies are correct
- Check browser console for errors

### Can't create org levels?
- Ensure you have ADMIN or OWNER role
- Check tRPC context is properly set
- Verify orgId is present in context

### Hierarchy view empty?
- Add people without managers first (they'll be root nodes)
- Then add people with managers assigned
- Refresh the page after adding people

## 🎨 Customization

### Adding More Fields to Person
Edit `apps/web/server/domain/org/org.schema.ts` and add to `createPersonSchema`:
```typescript
export const createPersonSchema = z.object({
  // ... existing fields
  department: z.string().optional(),
  location: z.string().optional(),
});
```

### Changing Role Permissions
Edit `apps/web/server/trpc/routers/org.ts` and modify the role checks:
```typescript
if (!['ADMIN', 'OWNER', 'MANAGER'].includes(ctx.role)) {
  throw new TRPCError({ code: 'FORBIDDEN' });
}
```

## 📝 Next Steps

Potential enhancements:
1. **Drag-and-drop hierarchy editor** - Rearrange reporting structure visually
2. **Org chart export** - Export hierarchy as PDF/PNG
3. **Team pages** - Show all people under a specific manager
4. **Historical tracking** - Track org changes over time
5. **Bulk import** - CSV upload for adding many people at once
6. **Integration with Person profiles** - Link to user accounts automatically

## 🎉 Conclusion

You now have a complete organization management system with:
- ✅ Custom org levels
- ✅ Manager-report hierarchy  
- ✅ Visual hierarchy view
- ✅ Admin role management
- ✅ Secure, role-based access control
- ✅ Beautiful, intuitive UI

The `davidgibbon24@gmail.com` account is set as the first admin and can manage all aspects of the organization!







