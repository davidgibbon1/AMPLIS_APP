# Auth Setup Status & Current Issue - Debug Context

## Current Status Summary

### ✅ What's Been Completed

1. **Supabase Configuration**
   - Email/Password provider enabled
   - Google OAuth configured with Client ID/Secret
   - TOTP/MFA enabled
   - Callback URLs configured (localhost:3000)

2. **Database & Schema**
   - Prisma schema updated with auth models (User, GoogleAccount, AuditLog)
   - Database migration completed (`pnpm db:push`)
   - RLS policies SQL file created and fixed (UUID → text casting)
   - **Status: RLS policies SQL may or may not have been run in Supabase**

3. **Codebase Implementation**
   - Supabase client utilities created (server, browser, middleware)
   - Auth server actions implemented (register, login, MFA)
   - Auth UI pages created (login, register, MFA setup/verify)
   - tRPC context updated with real Supabase auth
   - Middleware created for route protection
   - OAuth callback handler implemented
   - Audit logging system in place

4. **Environment Variables**
   - Need to verify these are set in `.env.local`:
     - DATABASE_URL
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY
     - NEXT_PUBLIC_APP_URL

## 🔴 Current Issue

**Symptom:** Login page gets stuck on "Signing in..." after creating an account

**What We See:**
- User: davidgibbon24@gmail.com
- Login button shows "Signing in..." (loading state)
- Process hangs/doesn't complete

## Possible Causes to Investigate

### 1. **User Creation Mismatch**
- User might be created in Supabase Auth but not in Prisma database
- Or vice versa

### 2. **RLS Policies Not Applied**
- If RLS policies weren't run, database queries will fail
- User can authenticate with Supabase but can't read their own profile

### 3. **Middleware Issues**
- Middleware might be blocking authenticated requests
- Cookie not being set/read correctly

### 4. **Context Loading Issue**
- tRPC context trying to load org memberships that don't exist
- Context query failing silently

### 5. **MFA Redirection**
- Login might be detecting MFA requirement and not redirecting properly

## Debug Steps to Take

### Step 1: Check Supabase Auth Dashboard

**Location:** Supabase Dashboard → Authentication → Users

**Questions:**
- Does the user `davidgibbon24@gmail.com` exist in Supabase Auth?
- What's the user's `id` (UUID)?
- Is the user confirmed?
- Does the user have any MFA factors enrolled?

### Step 2: Check Prisma Database

**Run in Supabase SQL Editor:**

```sql
-- Check if user exists in User table
SELECT * FROM "User" WHERE email = 'davidgibbon24@gmail.com';

-- Check the user's ID format
SELECT id, email, name, "createdAt" FROM "User";

-- Check if user has any org memberships
SELECT * FROM "UserOrgRole" WHERE "userId" = 'user-id-from-above';

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'User';
```

### Step 3: Check Browser Console

Look for:
- JavaScript errors
- Network errors (check Network tab)
- Failed API calls to `/api/trpc` or Supabase

### Step 4: Check Server Logs

When clicking "Sign in", look for:
- Server errors in terminal
- Supabase client errors
- tRPC errors

## Critical Files to Check

### 1. Environment Variables

**File:** `/apps/web/.env.local`

Should contain:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Login Action

**File:** `/apps/web/app/auth/actions.ts`

The `loginAction` function:
- Calls `supabase.auth.signInWithPassword()`
- Checks for MFA requirement
- Should redirect to `/projects` or `/auth/mfa/verify`

### 3. tRPC Context

**File:** `/apps/web/server/trpc/context.ts`

The context:
- Calls `supabase.auth.getUser()`
- Queries `UserOrgRole` table
- Might fail if user has no org or RLS blocks query

### 4. Middleware

**File:** `/apps/web/middleware.ts`

- Updates session via Supabase
- Checks protected routes
- Might be causing redirect loop

## Key User ID Architecture

**Important:** The system uses Supabase's `auth.uid()` as the User's primary key

1. **Supabase Auth** stores users with UUID
2. **Prisma User table** uses that same UUID as `id` (stored as `text`)
3. **RLS policies** use `auth.uid()::text` to match users

**This means:**
- When user registers via Supabase, we get their UUID
- We must create a matching User record in Prisma with that UUID as `id`
- Both must match exactly

## Likely Issue Diagnosis

Based on the symptoms, **most likely causes** (in order):

### 1. **RLS Policies Not Applied** (80% likely)
If RLS isn't enabled:
- Supabase login succeeds
- App tries to load user profile/org
- Database blocks the query (no RLS policy = no access)
- App hangs waiting for data

**Fix:** Run the RLS SQL script in Supabase

### 2. **User Has No Organization** (15% likely)
- User created successfully in both places
- Login succeeds
- Context tries to load org memberships
- No orgs found, context returns `org: null`
- App might not handle this case

**Fix:** Create an org for the user or handle null org case

### 3. **MFA Detection Issue** (5% likely)
- Login succeeds
- Code checks for MFA factors
- Redirect logic fails
- Stuck in loading state

**Fix:** Check loginAction's MFA handling

## Immediate Next Steps

### Priority 1: Verify RLS (CRITICAL)
```sql
-- In Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

If any show `rowsecurity = false`, **RUN THE RLS SCRIPT** immediately.

### Priority 2: Check User Creation
```sql
-- In Supabase SQL Editor
SELECT 
  u.id, 
  u.email, 
  u.name,
  COUNT(uor."orgId") as org_count
FROM "User" u
LEFT JOIN "UserOrgRole" uor ON u.id = uor."userId"
WHERE u.email = 'davidgibbon24@gmail.com'
GROUP BY u.id, u.email, u.name;
```

### Priority 3: Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for red errors
- Check Network tab for failed requests

## Expected Flow (Normal Operation)

1. User clicks "Sign in"
2. `loginAction` called with email/password
3. Supabase authenticates → returns session
4. Server action checks for MFA factors
5. If no MFA: Redirect to `/projects`
6. Page loads → middleware refreshes session
7. Page component loads → tRPC context gets user
8. Context queries User table + UserOrgRole
9. User sees projects page (or onboarding if no org)

## Where It's Likely Breaking

**Between steps 8-9:**
- Context query for UserOrgRole failing
- Either RLS blocking it, or user has no orgs
- App waiting forever for context to resolve

## Test Commands

```bash
# Check if dev server is running without errors
cd "/Users/davidgibbon/projects/AMPLIS APP"
pnpm dev

# Check for any TypeScript/lint errors
pnpm lint
```

## Summary for New Chat

**TL;DR:**
- Auth implementation is complete in code
- Supabase configured (email, OAuth, MFA)
- Database migrated
- **RLS policies might not be applied** (most likely issue)
- User can register but gets stuck on login
- Need to verify: RLS enabled, user exists in both places, user has org membership

**First Debug Step:**
Check if RLS policies are enabled in Supabase, then check if user exists in User table.

