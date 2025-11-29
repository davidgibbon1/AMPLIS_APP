-- Migration: Add OrgLevel and Person Hierarchy
-- This migration adds organization levels and manager hierarchy to the Person model

-- Create OrgLevel table
CREATE TABLE "OrgLevel" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgLevel_pkey" PRIMARY KEY ("id")
);

-- Add orgLevelId and managerId to Person table
ALTER TABLE "Person" ADD COLUMN "orgLevelId" TEXT;
ALTER TABLE "Person" ADD COLUMN "managerId" TEXT;

-- Remove the old "role" column from Person (now using orgLevelId)
ALTER TABLE "Person" DROP COLUMN IF EXISTS "role";

-- Add foreign key constraints
ALTER TABLE "OrgLevel" ADD CONSTRAINT "OrgLevel_orgId_fkey" 
    FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Person" ADD CONSTRAINT "Person_orgLevelId_fkey" 
    FOREIGN KEY ("orgLevelId") REFERENCES "OrgLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Person" ADD CONSTRAINT "Person_managerId_fkey" 
    FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraint for org level names within an org
ALTER TABLE "OrgLevel" ADD CONSTRAINT "OrgLevel_orgId_name_key" UNIQUE ("orgId", "name");

-- Add indexes for better query performance
CREATE INDEX "Person_orgId_idx" ON "Person"("orgId");
CREATE INDEX "Person_managerId_idx" ON "Person"("managerId");
CREATE INDEX "Person_orgLevelId_idx" ON "Person"("orgLevelId");

-- Update AuditAction enum to include new actions
-- Note: This is a PostgreSQL-specific operation
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ORG_LEVEL_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ORG_LEVEL_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ORG_LEVEL_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PERSON_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PERSON_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PERSON_DELETED';

-- Make davidgibbon24@gmail.com an admin
-- First, find the user and their org
DO $$
DECLARE
    user_id TEXT;
    org_id TEXT;
BEGIN
    -- Find the user by email
    SELECT id INTO user_id FROM "User" WHERE email = 'davidgibbon24@gmail.com' LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        -- Get the user's org (assuming they have at least one)
        SELECT "orgId" INTO org_id FROM "UserOrgRole" WHERE "userId" = user_id LIMIT 1;
        
        IF org_id IS NOT NULL THEN
            -- Update their role to ADMIN
            UPDATE "UserOrgRole" 
            SET role = 'ADMIN'
            WHERE "userId" = user_id AND "orgId" = org_id;
            
            RAISE NOTICE 'Updated user % to ADMIN in org %', user_id, org_id;
        ELSE
            RAISE NOTICE 'User % has no org membership', user_id;
        END IF;
    ELSE
        RAISE NOTICE 'User with email davidgibbon24@gmail.com not found';
    END IF;
END $$;







