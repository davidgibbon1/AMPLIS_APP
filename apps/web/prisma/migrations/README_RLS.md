# Row Level Security (RLS) Setup

This directory contains the RLS policies for Supabase that ensure multi-tenant data isolation.

## Setup Instructions

1. **Run Prisma migrations first** to create all tables:
   ```bash
   pnpm db:push
   # or
   npx prisma migrate dev
   ```

2. **Execute RLS policies in Supabase**:
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `rls_policies.sql`
   - Execute the script

3. **Verify RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND rowsecurity = true;
   ```

## Important Notes

### Service Role vs Anon Key

- **Anon Key**: Used for client-side operations. Subject to RLS policies.
- **Service Role Key**: Bypasses RLS. Use ONLY on the server for:
  - System operations (audit logging, background jobs)
  - Admin operations that need to bypass tenant isolation
  - **NEVER expose this key to the client**

### Testing RLS Policies

Test your RLS policies using the Supabase SQL editor with the following pattern:

```sql
-- Test as a specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- Try queries
SELECT * FROM "Project";

-- Reset
RESET role;
```

### Policy Design Principles

1. **Org-scoped resources**: Most tables use org membership checks
2. **Role-based permissions**: 
   - `MEMBER`: Read-only (can create own timesheets)
   - `MANAGER`: Can create/update projects and deliverables
   - `ADMIN`: Full management within org
   - `OWNER`: Full control including org settings
3. **Own-data access**: Users can always see/edit their own user profile
4. **Cascading checks**: Child resources check parent org membership

### Performance Considerations

- All RLS queries use indexed columns (userId, orgId, role)
- Avoid N+1 queries by including org checks in your application queries
- Use `EXPLAIN ANALYZE` in Supabase to check query performance
- Consider materialized views for complex permission checks if needed

### Common Issues

1. **"permission denied" errors**: 
   - Check that RLS is enabled on all tables
   - Verify user has org membership
   - Ensure you're using the correct role (anon vs service)

2. **Slow queries**:
   - Check that indexes are created
   - Simplify complex RLS policies
   - Consider caching org memberships in your application

3. **Service role operations failing**:
   - Service role should bypass RLS automatically
   - Check you're using `createServiceClient()` not `createClient()`

## Future Enhancements

- [ ] Add policies for row-level soft deletes
- [ ] Implement time-based access restrictions
- [ ] Add IP-based access controls for sensitive operations
- [ ] Create materialized view for user permissions cache
- [ ] Add database triggers for automatic audit logging

