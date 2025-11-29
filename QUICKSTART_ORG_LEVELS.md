# 🚀 Quick Start: Organization Levels & Hierarchy

## What's Been Built

A comprehensive organization management system with:
- **Custom org levels** (Consultant, Senior Consultant, etc.)
- **Manager-report hierarchy** with visual tree view
- **Admin management** separate from org levels
- **Beautiful UI** inspired by Supabase/n8n

## 🎯 Your Account

**Your email** (`davidgibbon24@gmail.com`) has been set as the **first ADMIN** 🎉

You can now:
- ✅ Create and manage organization levels
- ✅ Add people to your organization
- ✅ Set up reporting hierarchies
- ✅ Promote other users to admin

## 📋 Next Steps

### 1. Apply Database Migration

You need to run the migration to add the new tables to your Supabase database:

```bash
cd apps/web

# Option 1: Apply the SQL migration directly to Supabase
psql $DATABASE_URL -f prisma/migrations/add_org_levels_and_hierarchy.sql

# Option 2: Use Prisma (requires connection)
npx prisma db push

# Then regenerate Prisma client
npx prisma generate
```

### 2. Start the Development Server

```bash
# From the root of the project
pnpm dev

# Or from apps/web
cd apps/web
npm run dev
```

### 3. Access the New Features

Once the server is running, navigate to:

- **`/people`** - Manage organization structure
  - Create org levels
  - Add people
  - View hierarchy
  - List view with filters

- **`/admin`** - Manage user roles
  - View all org users
  - Change user roles
  - Promote admins

## 🎨 Feature Walkthrough

### Creating Your First Org Level

1. Go to **http://localhost:3000/people**
2. Click **"Manage Levels"** button
3. Click **"Add New Level"**
4. Enter details:
   - Name: "Senior Consultant"
   - Description: "Experienced consultants leading projects"
   - Order: 1
5. Click **"Create Level"**
6. Repeat for other levels (Consultant, Analyst, etc.)

### Adding Your First Person

1. On the People page, click **"Add Person"**
2. Fill in the form:
   - Name: "John Smith"
   - Email: "john@example.com"
   - Org Level: Select "Senior Consultant"
   - Manager: (leave empty for now - they'll be a root node)
   - Cost Rate: 150
   - Bill Rate: 300
3. Click **"Create Person"**

### Setting Up Hierarchy

1. Add a few more people with different levels
2. When adding someone, select a **Manager** from the dropdown
3. Switch to **"Hierarchy"** view to see the org chart
4. Expand/collapse nodes to explore the structure

### Making Someone an Admin

1. Go to **http://localhost:3000/admin**
2. Find the user in the list
3. Use the dropdown to change their role
4. Options: OWNER, ADMIN, MANAGER, MEMBER
5. Changes apply immediately

## 🔑 Role Permissions

| Role | Create Org Levels | Manage People | View Hierarchy | Manage User Roles |
|------|-------------------|---------------|----------------|-------------------|
| **OWNER** | ✅ | ✅ | ✅ | ✅ (including creating other owners) |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ (cannot create owners) |
| **MANAGER** | ❌ | ✅ | ✅ | ❌ |
| **MEMBER** | ❌ | ❌ | ✅ | ❌ |

## 📁 New Navigation

The sidebar now includes:
- **Projects** - Project management
- **People** - NEW! Organization & hierarchy
- **Billing** - Billing management
- **Settings** → **Account** - Profile settings
- **Settings** → **Security** - MFA & OAuth
- **Settings** → **Admin** - NEW! User role management

## 🎯 Common Use Cases

### Scenario 1: Setting Up a Consulting Team
```
1. Create levels: Partner → Senior Consultant → Consultant → Analyst
2. Add the partners first (no manager)
3. Add senior consultants, set partners as managers
4. Add consultants and analysts under senior consultants
5. View in hierarchy mode to see the full structure
```

### Scenario 2: Making Team Leads
```
1. Go to /admin
2. Find your team lead's user account
3. Change role from MEMBER → MANAGER
4. They can now manage people and projects
```

### Scenario 3: Adding New Admin
```
1. Go to /admin
2. Find the user
3. Change role to ADMIN
4. They can now manage org levels and user roles
```

## 🐛 Troubleshooting

### Migration Issues?
If the migration fails, you can manually run these commands in your Supabase SQL editor:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents from `apps/web/prisma/migrations/add_org_levels_and_hierarchy.sql`
3. Run the SQL
4. Then run `npx prisma generate` locally

### Can't See New Pages?
- Make sure you're logged in
- Clear browser cache and reload
- Check that the dev server restarted after the changes

### Not an Admin?
The migration sets `davidgibbon24@gmail.com` as admin. If this didn't work:
1. Go to Supabase Dashboard → Database → UserOrgRole table
2. Find your user record
3. Manually change `role` to `ADMIN`

## 📊 What You Get

### People Page Features
- 📊 **Stats dashboard** - Total people, levels, managers, unassigned
- 🔍 **Search & filter** - By name, email, or org level
- 🌳 **Hierarchy view** - Visual org chart with expand/collapse
- 📋 **List view** - Tabular view with all details
- ➕ **Quick actions** - Add, edit, delete people
- 🏢 **Level management** - Create and manage org levels

### Admin Page Features
- 👥 **User directory** - All users in your org
- 🎭 **Role badges** - Color-coded role indicators
- ⚡ **Quick role changes** - Dropdown to change roles
- 📚 **Permission guide** - Clear explanation of each role
- 🔒 **Security** - Proper RBAC enforcement

## 🎨 Design Philosophy

**Separate System Roles from Business Hierarchy**
- **Admin roles** (Owner/Admin/Manager/Member) = System permissions
- **Org levels** (Consultant/Senior/etc.) = Business structure
- A Junior Analyst can be a System Admin - they're independent!

**Intuitive Hierarchy Visualization**
- Tree structure like Supabase relationship diagrams
- Expandable nodes to reduce clutter
- Color-coded badges for quick identification
- Shows direct report counts

## 📖 Full Documentation

See `ORG_LEVELS_IMPLEMENTATION.md` for complete technical documentation including:
- Full API reference
- Database schema details
- Security model
- Customization guide
- Advanced features

## 🎉 You're Ready!

Everything is set up and ready to go. Just:
1. Run the migration
2. Start the dev server
3. Navigate to `/people` or `/admin`
4. Start building your org structure!

Your account (`davidgibbon24@gmail.com`) has full admin access to everything.

Happy organizing! 🚀







