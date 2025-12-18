# AMPLIS Gantt Module - Deployment Guide

## Overview

This guide will help you deploy the AMPLIS Gantt module to your production environment.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ with pgvector extension
- Supabase project (or direct Postgres access)
- pnpm package manager

## Step 1: Database Migration

### Option A: Using Prisma Migrate

```bash
cd apps/web
pnpm prisma migrate dev --name add_gantt_module
```

### Option B: Manual SQL Execution

If you prefer to run the migration manually:

```bash
cd apps/web/prisma/migrations
psql $DATABASE_URL -f add_gantt_module.sql
```

### Verify Migration

```bash
pnpm prisma db pull
pnpm prisma generate
```

## Step 2: Install Dependencies

All required dependencies have been added to `package.json`:

```bash
cd apps/web
pnpm install
```

Dependencies installed:
- `reactflow` (11.11.4) - Gantt canvas rendering
- `date-fns` (4.1.0) - Date manipulation
- `zustand` (5.0.8) - State management

## Step 3: Environment Variables

Add the following to your `.env` file:

```bash
# Existing
DATABASE_URL="your_postgres_connection_string"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_key"

# Optional: For AI features (future)
OPENAI_API_KEY="your_openai_key"

# Optional: For Google Calendar sync (future)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

## Step 4: Build and Test Locally

```bash
# From project root
pnpm run dev

# Or from web app
cd apps/web
pnpm dev
```

Navigate to: `http://localhost:3000/projects/[project-id]/gantt`

## Step 5: Production Build

```bash
# From project root
pnpm run build

# Or from web app
cd apps/web
pnpm build
```

## Step 6: Deploy to Vercel

### Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Turborepo configuration
3. Set environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

## Step 7: Post-Deployment Verification

### Test Checklist

- [ ] Gantt page loads without errors
- [ ] Task bars render correctly
- [ ] Drag-and-drop works
- [ ] Resource panel opens
- [ ] Theme panel opens
- [ ] TRPC endpoints respond
- [ ] Database queries execute
- [ ] Audit trail records changes

### Health Check Endpoints

Create a simple health check:

```typescript
// apps/web/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

## Step 8: Performance Optimization

### Database Indexes

Ensure all indexes from the migration are created:

```sql
-- Verify indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('Task', 'TaskResource', 'TaskHistory', 'ThemeSettings');
```

### Caching Strategy

For production, consider:

1. **Browser Caching**: Static assets cached via Vercel CDN
2. **API Caching**: Use TanStack Query cache settings
3. **Database Caching**: Supabase includes built-in connection pooling

### Load Testing

Test with realistic data volumes:

```bash
# Generate test data
cd apps/web/prisma
pnpm ts-node seed-gantt.ts
```

## Step 9: Monitoring Setup

### Sentry Integration

```bash
pnpm add @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### Logging

The Gantt module includes comprehensive logging:
- All task changes logged to `TaskHistory`
- API errors logged via TRPC error handlers
- Client errors caught by React error boundaries

## Step 10: Backup Strategy

### Database Backups

```bash
# Daily backups (cron job)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Supabase Backups

Supabase Pro includes:
- Daily automated backups (7-day retention)
- Point-in-time recovery
- Manual backup triggers

## Rollback Plan

If issues occur after deployment:

### Database Rollback

```sql
-- Rollback Gantt module
DROP TABLE IF EXISTS "UserPreferences";
DROP TABLE IF EXISTS "ThemeSettings";
DROP TABLE IF EXISTS "TaskHistory";
DROP TABLE IF EXISTS "TaskResource";
DROP TABLE IF EXISTS "Task";
DROP TABLE IF EXISTS "CustomResource";
DROP TYPE IF EXISTS "TaskStatus";
DROP TYPE IF EXISTS "TaskHistoryAction";
```

### Code Rollback

```bash
# Via Vercel dashboard
# Deployments -> [Previous deployment] -> Redeploy
```

## Troubleshooting

### Issue: Migration Fails

**Symptom**: Prisma migrate fails with foreign key errors

**Solution**:
```bash
# Check current schema
pnpm prisma db pull

# If needed, manually create missing parent tables first
pnpm prisma db push
```

### Issue: TRPC Endpoints Not Found

**Symptom**: 404 errors when calling Gantt APIs

**Solution**:
- Verify `appRouter` includes new routers in `server/trpc/routers/index.ts`
- Clear `.next` cache: `rm -rf .next`
- Rebuild: `pnpm build`

### Issue: React Flow Not Rendering

**Symptom**: Blank canvas or "module not found" errors

**Solution**:
```bash
# Reinstall dependencies
pnpm install --force

# Clear cache
rm -rf node_modules/.cache
```

### Issue: Performance Issues with Large Projects

**Symptom**: Slow rendering with 500+ tasks

**Solution**:
- Implement task virtualization (already in React Flow)
- Add pagination to task lists
- Optimize database queries with `include` selectors

## Production Checklist

Before going live:

- [ ] All migrations applied successfully
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Database backups scheduled
- [ ] Monitoring configured (Sentry/Datadog)
- [ ] Error tracking enabled
- [ ] Performance tested with realistic data
- [ ] Security audit completed
- [ ] User documentation published
- [ ] Support team trained

## Security Considerations

### CSRF Protection

Next.js includes built-in CSRF protection. Ensure:
- All mutations use POST requests
- API routes validate request origins

### SQL Injection Prevention

Prisma provides automatic SQL injection protection via parameterized queries. Never concatenate user input in raw SQL.

### XSS Protection

- All user input sanitized via Zod validation
- React automatically escapes rendered content
- Use `dangerouslySetInnerHTML` sparingly

### Rate Limiting

Consider adding rate limiting for API endpoints:

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

## Scaling Considerations

### When to Scale

Monitor these metrics:
- Database connection pool saturation
- API response times >500ms
- Memory usage >80%
- Task count >10,000 per project

### Horizontal Scaling

Vercel automatically scales Next.js instances. For database:
- Upgrade Supabase tier for more connections
- Implement read replicas for queries
- Add Redis cache for frequent reads

### Vertical Scaling

- Increase Vercel instance size
- Upgrade database resources
- Enable edge caching

## Maintenance

### Weekly Tasks

- [ ] Review error logs
- [ ] Check database performance
- [ ] Monitor API latency
- [ ] Review user feedback

### Monthly Tasks

- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Update dependencies
- [ ] Security patches
- [ ] Capacity planning review

### Quarterly Tasks

- [ ] Performance audit
- [ ] Cost optimization review
- [ ] Feature usage analytics
- [ ] User satisfaction survey

## Support

### Documentation

- **User Guide**: `/GANTT_USER_GUIDE.md`
- **Implementation Plan**: `/GANTT_MODULE_IMPLEMENTATION.md`
- **API Reference**: Generated via TRPC

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Email Support**: support@amplis.app
- **Slack Channel**: #gantt-module

## Next Steps

After successful deployment:

1. **Enable Features**: Activate advanced features incrementally
2. **User Onboarding**: Train users on Gantt functionality
3. **Gather Feedback**: Monitor usage and collect improvement suggestions
4. **Iterate**: Prioritize enhancements based on feedback

## Advanced Features (Future)

Features scaffolded but requiring additional work:

### Google Calendar Sync
- Implement OAuth flow
- Create sync service
- Add bi-directional sync logic

### Real-time Collaboration
- Enable Supabase Realtime channels
- Add presence indicators
- Implement conflict resolution

### AI Assistant
- Integrate OpenAI API
- Train on project patterns
- Refine suggestion algorithms

### Export Features
- Implement PDF generation (puppeteer/playwright)
- Add PNG export (html2canvas)
- Create shareable link system

### Dependency Visualization
- Implement arrow rendering
- Calculate critical path
- Add constraint validation

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Production URL**: ___________  
**Rollback Plan Verified**: ☐ Yes ☐ No

Good luck with your deployment! 🚀





