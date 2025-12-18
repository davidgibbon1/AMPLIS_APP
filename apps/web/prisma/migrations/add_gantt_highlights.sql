-- Migration: Add Gantt Highlights (Breaks, Holidays, Phase Gates)
-- This enables visual highlighting of periods on the Gantt chart

CREATE TABLE IF NOT EXISTS "GanttHighlight" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "colour" TEXT NOT NULL DEFAULT '#e5e7eb',
    "opacity" INTEGER NOT NULL DEFAULT 30,
    "showLabel" BOOLEAN NOT NULL DEFAULT true,
    "labelPosition" TEXT NOT NULL DEFAULT 'bottom',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GanttHighlight_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraint
ALTER TABLE "GanttHighlight" 
ADD CONSTRAINT "GanttHighlight_projectId_fkey" 
FOREIGN KEY ("projectId") REFERENCES "Project"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "GanttHighlight_projectId_idx" ON "GanttHighlight"("projectId");
CREATE INDEX IF NOT EXISTS "GanttHighlight_projectId_startDate_endDate_idx" ON "GanttHighlight"("projectId", "startDate", "endDate");

