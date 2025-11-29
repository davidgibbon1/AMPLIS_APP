#!/bin/bash
# Migration Script for Organization Levels & Hierarchy
# This script applies the database changes needed for the new features

set -e  # Exit on error

echo "🚀 AMPLIS Organization Levels Migration"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Must be run from apps/web directory"
    echo "Usage: cd apps/web && bash ../../apply_org_migration.sh"
    exit 1
fi

echo "📋 This migration will:"
echo "  1. Create OrgLevel table"
echo "  2. Add orgLevelId and managerId to Person table"
echo "  3. Add audit log actions for org management"
echo "  4. Set davidgibbon24@gmail.com as ADMIN"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "Please set it in your .env file or export it"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Ask for confirmation
read -p "⚠️  This will modify your database. Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔄 Applying migration..."
echo ""

# Apply the migration
psql "$DATABASE_URL" -f prisma/migrations/add_org_levels_and_hierarchy.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📦 Regenerating Prisma client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 All done!"
        echo ""
        echo "📋 Next steps:"
        echo "  1. Start your dev server: pnpm dev"
        echo "  2. Navigate to /people to manage org structure"
        echo "  3. Navigate to /admin to manage user roles"
        echo ""
        echo "👤 Your account (davidgibbon24@gmail.com) is now an ADMIN"
        echo ""
    else
        echo ""
        echo "⚠️  Migration applied but Prisma generation failed"
        echo "Try running: npx prisma generate"
        echo ""
    fi
else
    echo ""
    echo "❌ Migration failed"
    echo "Check the error message above"
    echo ""
    exit 1
fi







