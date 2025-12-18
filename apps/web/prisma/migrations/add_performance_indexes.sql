-- Performance indexes for faster queries
-- Run this manually: psql $DATABASE_URL -f prisma/migrations/add_performance_indexes.sql

-- Project indexes (critical for all project queries)
CREATE INDEX IF NOT EXISTS "Project_orgId_idx" ON "Project"("orgId");
CREATE INDEX IF NOT EXISTS "Project_orgId_status_idx" ON "Project"("orgId", "status");
CREATE INDEX IF NOT EXISTS "Project_orgId_updatedAt_idx" ON "Project"("orgId", "updatedAt" DESC);

-- Deliverable index (used in Gantt and project detail views)
CREATE INDEX IF NOT EXISTS "Deliverable_projectId_idx" ON "Deliverable"("projectId");

