-- Enable Row Level Security on all tables
-- This ensures multi-tenant data isolation at the database level

-- Note: Execute this SQL manually in your Supabase SQL editor
-- These policies work with Supabase Auth's auth.uid() function

-- =============================================================================
-- USERS & ORGANIZATIONS
-- =============================================================================

-- User table: Users can only see and update their own profile
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON "User" FOR SELECT
USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
ON "User" FOR UPDATE
USING (auth.uid()::text = id);

-- Org table: Users can view orgs they're members of
ALTER TABLE "Org" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orgs they belong to"
ON "Org" FOR SELECT
USING (
  id IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Org owners and admins can update org"
ON "Org" FOR UPDATE
USING (
  id IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN')
  )
);

-- UserOrgRole: Users can view their own memberships; admins can manage
ALTER TABLE "UserOrgRole" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org memberships"
ON "UserOrgRole" FOR SELECT
USING (
  "userId" = auth.uid()::text OR
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Org owners and admins can manage memberships"
ON "UserOrgRole" FOR ALL
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN')
  )
);

-- =============================================================================
-- OAUTH & EXTERNAL ACCOUNTS
-- =============================================================================

-- GoogleAccount: Users can only see and manage their own accounts
ALTER TABLE "GoogleAccount" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google accounts"
ON "GoogleAccount" FOR SELECT
USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can manage own Google accounts"
ON "GoogleAccount" FOR ALL
USING ("userId" = auth.uid()::text);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

-- AuditLog: Users can view logs for their orgs (admins+) or their own actions
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
ON "AuditLog" FOR SELECT
USING ("actorId" = auth.uid()::text);

CREATE POLICY "Org admins can view org audit logs"
ON "AuditLog" FOR SELECT
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "System can insert audit logs"
ON "AuditLog" FOR INSERT
WITH CHECK (true); -- Backend creates these with service role

-- =============================================================================
-- PROJECTS & DELIVERABLES
-- =============================================================================

-- Project: Users can only access projects in their orgs
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their orgs"
ON "Project" FOR SELECT
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Managers and above can create projects"
ON "Project" FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  )
);

CREATE POLICY "Managers and above can update projects"
ON "Project" FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  )
);

CREATE POLICY "Owners and admins can delete projects"
ON "Project" FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN')
  )
);

-- Deliverable: Scoped by project's org
ALTER TABLE "Deliverable" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deliverables in their orgs"
ON "Deliverable" FOR SELECT
USING (
  "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
    )
  )
);

CREATE POLICY "Managers and above can manage deliverables"
ON "Deliverable" FOR ALL
USING (
  "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
    )
  )
);

-- =============================================================================
-- RESOURCES & ALLOCATIONS
-- =============================================================================

-- Person: Scoped by org
ALTER TABLE "Person" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view people in their orgs"
ON "Person" FOR SELECT
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Managers and above can manage people"
ON "Person" FOR ALL
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  )
);

-- Allocation: Scoped by project's org
ALTER TABLE "Allocation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view allocations in their orgs"
ON "Allocation" FOR SELECT
USING (
  "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
    )
  )
);

CREATE POLICY "Managers and above can manage allocations"
ON "Allocation" FOR ALL
USING (
  "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
    )
  )
);

-- =============================================================================
-- TIMESHEETS
-- =============================================================================

-- Timesheet: All members can view; individuals can create their own; managers can manage all
ALTER TABLE "Timesheet" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timesheets in their orgs"
ON "Timesheet" FOR SELECT
USING (
  "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can create their own timesheets"
ON "Timesheet" FOR INSERT
WITH CHECK (
  "personId" IN (
    SELECT id FROM "Person"
    WHERE "userId" = auth.uid()::text
  )
  AND "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can update their own timesheets"
ON "Timesheet" FOR UPDATE
USING (
  "personId" IN (
    SELECT id FROM "Person"
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Managers and above can manage all timesheets"
ON "Timesheet" FOR ALL
USING (
  "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
    )
  )
);

-- =============================================================================
-- BILLING
-- =============================================================================

-- Invoice: Scoped by project's org
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices in their orgs"
ON "Invoice" FOR SELECT
USING (
  "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
    )
  )
);

CREATE POLICY "Managers and above can manage invoices"
ON "Invoice" FOR ALL
USING (
  "projectId" IN (
    SELECT id FROM "Project"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
    )
  )
);

-- InvoiceLine: Scoped by invoice
ALTER TABLE "InvoiceLine" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice lines in their orgs"
ON "InvoiceLine" FOR SELECT
USING (
  "invoiceId" IN (
    SELECT id FROM "Invoice"
    WHERE "projectId" IN (
      SELECT id FROM "Project"
      WHERE "orgId" IN (
        SELECT "orgId" FROM "UserOrgRole"
        WHERE "userId" = auth.uid()::text
      )
    )
  )
);

CREATE POLICY "Managers and above can manage invoice lines"
ON "InvoiceLine" FOR ALL
USING (
  "invoiceId" IN (
    SELECT id FROM "Invoice"
    WHERE "projectId" IN (
      SELECT id FROM "Project"
      WHERE "orgId" IN (
        SELECT "orgId" FROM "UserOrgRole"
        WHERE "userId" = auth.uid()::text
        AND role IN ('OWNER', 'ADMIN', 'MANAGER')
      )
    )
  )
);

-- =============================================================================
-- DOCUMENTS & RAG
-- =============================================================================

-- DocumentSource: Scoped by org
ALTER TABLE "DocumentSource" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in their orgs"
ON "DocumentSource" FOR SELECT
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Members can create documents"
ON "DocumentSource" FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Managers and above can manage documents"
ON "DocumentSource" FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  )
);

CREATE POLICY "Managers and above can delete documents"
ON "DocumentSource" FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "UserOrgRole"
    WHERE "userId" = auth.uid()::text
    AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  )
);

-- DocumentChunk: Scoped by source's org
ALTER TABLE "DocumentChunk" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document chunks in their orgs"
ON "DocumentChunk" FOR SELECT
USING (
  "sourceId" IN (
    SELECT id FROM "DocumentSource"
    WHERE "orgId" IN (
      SELECT "orgId" FROM "UserOrgRole"
      WHERE "userId" = auth.uid()::text
    )
  )
);

CREATE POLICY "System can manage document chunks"
ON "DocumentChunk" FOR ALL
WITH CHECK (true); -- Backend manages these with service role

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. These policies assume you're using Supabase auth.uid()
-- 2. Service role operations (like background jobs) bypass RLS
-- 3. Test thoroughly in a staging environment before production
-- 4. Consider adding policies for soft deletes if implemented
-- 5. Monitor query performance - complex policies can impact speed
-- 6. Add indexes on foreign keys if you see slow queries

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes to support RLS policy queries
CREATE INDEX IF NOT EXISTS idx_user_org_role_user_org 
ON "UserOrgRole"("userId", "orgId");

CREATE INDEX IF NOT EXISTS idx_user_org_role_org_role 
ON "UserOrgRole"("orgId", "role");

CREATE INDEX IF NOT EXISTS idx_project_org 
ON "Project"("orgId");

CREATE INDEX IF NOT EXISTS idx_person_org 
ON "Person"("orgId");

CREATE INDEX IF NOT EXISTS idx_person_user 
ON "Person"("userId");

CREATE INDEX IF NOT EXISTS idx_document_source_org 
ON "DocumentSource"("orgId");

CREATE INDEX IF NOT EXISTS idx_audit_log_org_created 
ON "AuditLog"("orgId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created 
ON "AuditLog"("actorId", "createdAt");

