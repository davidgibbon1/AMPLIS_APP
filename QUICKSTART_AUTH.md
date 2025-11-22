# Quick Start: Authentication Setup

Get authentication up and running in 10 minutes.

## Prerequisites

- [ ] Supabase account ([sign up here](https://supabase.com))
- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)

## Step 1: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to be provisioned
3. Note down your project URL and keys

## Step 2: Configure Environment (1 min)

1. Copy environment template:
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

2. Fill in Supabase credentials in `.env.local`:
   ```env
   DATABASE_URL="your-database-url-from-supabase"
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   Get these from: Supabase Dashboard → Settings → API

## Step 3: Supabase Dashboard Setup (3 min)

### Enable Auth Providers

1. Go to Authentication → Providers
2. Enable **Email** (already enabled by default)
3. Enable **Google** (optional, see full guide for OAuth setup)

### Configure Auth Settings

1. Go to Authentication → URL Configuration
2. Add Redirect URL: `http://localhost:3000/auth/callback`

### Enable MFA

1. Go to Authentication → Policies → MFA
2. Enable **TOTP (Time-based One-Time Password)**
3. Set to **Optional** (users can enable themselves)

## Step 4: Database Setup (2 min)

1. Push Prisma schema to database:
   ```bash
   cd apps/web
   pnpm db:push
   ```

2. Apply RLS policies:
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `apps/web/prisma/migrations/rls_policies.sql`
   - Paste and run in SQL editor

## Step 5: Install & Run (2 min)

1. Install dependencies:
   ```bash
   # From project root
   pnpm install
   ```

2. Start dev server:
   ```bash
   pnpm dev
   ```

3. Open http://localhost:3000

## Step 6: Test It Out!

### Register a New User

1. Go to http://localhost:3000/auth/register
2. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Password: (min 12 chars, uppercase, lowercase, digit)
3. Click "Create account"

### Set Up MFA (Optional)

1. Scan QR code with Google Authenticator / Authy / 1Password
2. Enter 6-digit code
3. You're logged in!

### Or Skip MFA

1. Click "Skip for now"
2. You can enable it later in Settings → Security

### Create Your Organization

1. You'll be redirected to `/onboarding`
2. Enter organization name (e.g., "My Company")
3. Slug is auto-generated (e.g., "my-company")
4. Click "Create Organization"

🎉 **You're all set!** Authentication is working.

## Quick Verification

### Check Database

In Supabase Dashboard → Table Editor:
- `User` table should have your user
- `auth.users` should match

### Check RLS

In Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```
Should show all tables with RLS enabled.

### Check Audit Logs

In Supabase SQL Editor:
```sql
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;
```
Should show your registration event.

## Next Steps

- [ ] Read full setup guide: `SETUP_AUTH.md`
- [ ] Review implementation: `AUTH_IMPLEMENTATION_SUMMARY.md`
- [ ] Configure Google OAuth (for production)
- [ ] Customize email templates in Supabase
- [ ] Set up production environment
- [ ] Add team members to your org (TODO: implement invite system)

## Troubleshooting

### "Invalid login credentials"
- Check email/password are correct
- Verify user exists in Supabase Auth dashboard

### "Cannot connect to database"
- Check `DATABASE_URL` in `.env.local`
- Ensure Supabase project is running

### "RLS policy violation"
- Make sure you ran `rls_policies.sql`
- Check that user has org membership

### Middleware redirect loop
- Clear browser cookies
- Restart dev server

### Still stuck?
- Check detailed guide: `SETUP_AUTH.md`
- Review implementation: `AUTH_IMPLEMENTATION_SUMMARY.md`
- Check browser console for errors
- Check terminal for server errors

## What You Get

✅ **Email/Password Auth** - Secure authentication  
✅ **Google OAuth** - One-click sign-in (after OAuth setup)  
✅ **MFA/2FA** - Time-based one-time passwords  
✅ **Route Protection** - Automatic auth checks  
✅ **Multi-Tenant** - Organization-based isolation  
✅ **Audit Logging** - Track all security events  
✅ **Session Management** - Secure cookie-based sessions  
✅ **RLS Policies** - Database-level security  

## Important Security Notes

⚠️ **NEVER commit `.env.local` to git** (already in .gitignore)  
⚠️ **NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to client**  
⚠️ **Use different Supabase projects for dev/staging/prod**  
⚠️ **Rotate service role key every 90 days in production**

---

**Time to complete:** ~10 minutes  
**Difficulty:** Easy  
**Questions?** See `SETUP_AUTH.md` for detailed guide

