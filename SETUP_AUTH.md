# Authentication Setup Guide

This guide walks you through setting up Supabase authentication for the Amplis application.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- pnpm or npm installed
- Basic understanding of Next.js and React

## Step 1: Supabase Dashboard Configuration

### 1.1 Enable Email/Password Authentication

1. Open your Supabase dashboard
2. Go to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure password requirements:
   - Minimum password length: **12 characters**
   - Require uppercase: **Yes**
   - Require lowercase: **Yes**
   - Require numbers: **Yes**
   - Require special characters: **Optional** (recommended)

### 1.2 Enable Google OAuth (Optional but Recommended)

1. In **Authentication** → **Providers**, enable **Google**
2. Follow Supabase's guide to create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
3. Copy Client ID and Client Secret to Supabase
4. Add scopes for Calendar and Drive access:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/drive.readonly
   ```

### 1.3 Configure Multi-Factor Authentication (MFA)

1. Go to **Authentication** → **Policies** → **MFA**
2. Enable **TOTP (Time-based One-Time Password)**
3. Optionally enable **Phone/SMS** if you want phone-based MFA
4. Set MFA enforcement level:
   - **Optional** (recommended for onboarding): Users can enable it themselves
   - **Required**: All users must set up MFA
   - **Mandatory for specific roles**: Enforce for admins/owners only

### 1.4 Set Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:
   
   **Site URL:**
   ```
   http://localhost:3000
   ```
   
   **Redirect URLs:**
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   ```

### 1.5 Configure Email Templates (Optional)

Customize the email templates in **Authentication** → **Email Templates**:
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password

## Step 2: Environment Variables

1. Copy the example environment file:
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   # Database
   DATABASE_URL="your-database-connection-string"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. Get your Supabase credentials from:
   - Dashboard → **Settings** → **API**
   - URL: `Project URL`
   - Anon key: `anon public`
   - Service role key: `service_role` (**Keep this secret!**)

## Step 3: Database Setup

### 3.1 Run Prisma Migrations

```bash
cd apps/web
pnpm db:push
```

This will create all necessary tables in your Supabase Postgres database.

### 3.2 Apply Row Level Security (RLS) Policies

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open `apps/web/prisma/migrations/rls_policies.sql`
4. Copy the entire content and paste it into the SQL editor
5. Click **Run** to execute

This sets up multi-tenant data isolation at the database level.

### 3.3 Verify RLS is Enabled

Run this query in the SQL editor to verify:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

You should see all your tables listed with `rowsecurity = true`.

## Step 4: Install Dependencies

```bash
# From the root of the monorepo
pnpm install

# Or just in the web app
cd apps/web
pnpm install
```

## Step 5: Start Development Server

```bash
# From root
pnpm dev

# Or from apps/web
cd apps/web
pnpm dev
```

Visit http://localhost:3000 - you should see the app!

## Step 6: Test Authentication Flow

### 6.1 User Registration

1. Navigate to http://localhost:3000/auth/register
2. Fill in the registration form:
   - Full Name
   - Email
   - Password (min 12 chars, uppercase, lowercase, digit)
3. Click "Create account"
4. You should be redirected to the MFA setup page

### 6.2 MFA Setup (Optional)

1. Scan the QR code with an authenticator app:
   - Google Authenticator
   - Authy
   - 1Password
   - Microsoft Authenticator
2. Enter the 6-digit code
3. Click "Verify & Continue"
4. You're now logged in!

### 6.3 Login with MFA

1. Navigate to http://localhost:3000/auth/login
2. Enter email and password
3. If MFA is enabled, you'll be redirected to enter your 6-digit code
4. Enter code from authenticator app
5. You're logged in!

### 6.4 Google OAuth Login

1. Click "Continue with Google" on login or register page
2. Authorize the app with your Google account
3. Grant Calendar and Drive permissions
4. You're redirected back and logged in!

## Step 7: Create Your First Organization

After first login, new users need an organization:

1. You'll be redirected to `/onboarding`
2. Create your first organization:
   - Organization Name
   - Organization Slug (URL-friendly)
3. You'll be assigned as the OWNER role
4. Start creating projects!

## Security Best Practices

### Environment Variables

- **NEVER** commit `.env.local` to git (already in .gitignore)
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Use different Supabase projects for dev/staging/production

### Password Requirements

Our default requirements:
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

Consider adding special characters for production.

### MFA Best Practices

- **Recommend** MFA during onboarding
- **Require** MFA for admin/owner roles
- Store MFA recovery codes securely
- Implement account recovery flow for lost devices

### Token Management

- Access tokens expire after 1 hour (Supabase default)
- Refresh tokens are used automatically by middleware
- OAuth tokens are encrypted before storage (implement in production)
- Rotate service role keys regularly

### Audit Logging

All security-related actions are logged:
- User registration/login
- MFA enrollment/verification
- OAuth connections
- Role changes
- Password changes

Access audit logs via:
```typescript
import { getOrgAuditLogs } from '@/lib/audit/logger'

const logs = await getOrgAuditLogs('org-id', {
  limit: 50,
  action: 'MFA_ENROLLED',
})
```

## Troubleshooting

### "Invalid login credentials"

- Check that email/password are correct
- Verify user exists in Supabase Auth dashboard
- Check that email is confirmed (if email confirmation is enabled)

### "No org context"

- User needs to be added to an organization
- Check `UserOrgRole` table in database
- New users should go through onboarding to create an org

### MFA not working

- Ensure MFA is enabled in Supabase dashboard
- Check that time is synced on device with authenticator app
- Verify factor is enrolled: Check `auth.mfa_factors` table

### OAuth redirect not working

- Verify redirect URLs are configured in Supabase
- Check that Google OAuth credentials are valid
- Ensure scopes are correctly set

### RLS policies blocking queries

- Check that user has org membership
- Verify you're using correct Supabase client (server vs browser)
- For admin operations, use `createServiceClient()`
- Check SQL policies match your table structure

### Middleware redirect loop

- Clear browser cookies
- Check middleware matcher config
- Verify auth routes vs protected routes

## Testing

### Unit Tests

Test auth actions:
```bash
pnpm test apps/web/app/auth/actions.test.ts
```

### Integration Tests

Test full auth flows:
```bash
pnpm test:e2e
```

### Manual Testing Checklist

- [ ] Register new user with email/password
- [ ] Register with Google OAuth
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Enable MFA after registration
- [ ] Login with MFA verification
- [ ] Disable MFA in settings
- [ ] Password reset flow
- [ ] Protected routes redirect to login
- [ ] Auth routes redirect to app when logged in
- [ ] Logout clears session

## Production Deployment

### Environment Variables

Set these in your hosting platform (Vercel, Railway, etc.):

```env
DATABASE_URL="your-production-db-url"
NEXT_PUBLIC_SUPABASE_URL="your-production-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-production-service-key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Security Checklist

- [ ] Rotate service role key after initial setup
- [ ] Enable email confirmation for new users
- [ ] Set up custom SMTP for transactional emails
- [ ] Configure rate limiting for auth endpoints
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Configure WAF rules if applicable
- [ ] Review and test all RLS policies
- [ ] Implement account lockout after failed attempts
- [ ] Set up 2FA recovery codes flow
- [ ] Configure session timeout policies
- [ ] Enable audit log archival

### Performance Optimization

- [ ] Add database indexes (already in RLS migration)
- [ ] Cache org memberships in application
- [ ] Implement Redis for rate limiting
- [ ] Monitor Supabase connection pool
- [ ] Set up CDN for static assets
- [ ] Enable Next.js caching strategies

## Support & Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth 2.0 Spec](https://oauth.net/2/)

## Need Help?

- Check Supabase Discord
- Review audit logs for errors
- Check browser console for client-side errors
- Review Supabase logs in dashboard
- Check Next.js server logs

---

**Last Updated:** November 2025
**Version:** 1.0.0

