-- AMPLIS Gantt Module - Database Migration
-- Run this migration to add all Gantt-related tables

-- Task Status Enum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'UNDER_REVIEW', 'COMPLETED');

-- Task History Action Enum
CREATE TYPE "TaskHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'MOVED', 'RESIZED', 'RESOURCE_ASSIGNED', 'RESOURCE_REMOVED', 'STATUS_CHANGED');

-- Task Table
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliverableId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "estimatedHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "actualHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costEstimated" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costActual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "colour" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "dependsOn" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Task_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_deliverableId_idx" ON "Task"("deliverableId");

-- Custom Resource Table
CREATE TABLE "CustomResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "CustomResource_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CustomResource_orgId_idx" ON "CustomResource"("orgId");

-- Task Resource Table
CREATE TABLE "TaskResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "personId" TEXT,
    "customResourceId" TEXT,
    "allocatedHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "actualHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "TaskResource_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskResource_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TaskResource_customResourceId_fkey" FOREIGN KEY ("customResourceId") REFERENCES "CustomResource"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "TaskResource_taskId_idx" ON "TaskResource"("taskId");
CREATE INDEX "TaskResource_personId_idx" ON "TaskResource"("personId");

-- Task History Table
CREATE TABLE "TaskHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "TaskHistoryAction" NOT NULL,
    "fieldName" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "TaskHistory_taskId_createdAt_idx" ON "TaskHistory"("taskId", "createdAt");

-- Theme Settings Table
CREATE TABLE "ThemeSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "orgId" TEXT NOT NULL,
    "primaryColour" TEXT NOT NULL DEFAULT '#3b82f6',
    "accentColour" TEXT NOT NULL DEFAULT '#1e40af',
    "backgroundColour" TEXT NOT NULL DEFAULT '#f8fafc',
    "backgroundImageUrl" TEXT,
    "backgroundBlur" INTEGER NOT NULL DEFAULT 0,
    "backgroundDim" INTEGER NOT NULL DEFAULT 0,
    "logoUrl" TEXT,
    "logoOpacity" INTEGER NOT NULL DEFAULT 30,
    "logoPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ThemeSettings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ThemeSettings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ThemeSettings_orgId_projectId_key" UNIQUE ("orgId", "projectId")
);

CREATE INDEX "ThemeSettings_orgId_idx" ON "ThemeSettings"("orgId");
CREATE INDEX "ThemeSettings_projectId_idx" ON "ThemeSettings"("projectId");

-- User Preferences Table
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "ganttZoomLevel" TEXT NOT NULL DEFAULT 'week',
    "ganttSnapToGrid" BOOLEAN NOT NULL DEFAULT true,
    "ganttShowDependencies" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Comments
COMMENT ON TABLE "Task" IS 'Individual tasks within deliverables for Gantt scheduling';
COMMENT ON TABLE "CustomResource" IS 'Custom resources (contractors, equipment, etc.) for task allocation';
COMMENT ON TABLE "TaskResource" IS 'Resource assignments to tasks with hours and rates';
COMMENT ON TABLE "TaskHistory" IS 'Audit trail of all task changes';
COMMENT ON TABLE "ThemeSettings" IS 'Gantt chart visual customization settings';
COMMENT ON TABLE "UserPreferences" IS 'User-specific Gantt view preferences';





