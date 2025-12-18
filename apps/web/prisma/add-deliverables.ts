import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding deliverables to existing projects...');

  // Get all projects
  const projects = await prisma.project.findMany({
    include: {
      deliverables: true
    }
  });

  console.log(`Found ${projects.length} project(s)`);

  for (const project of projects) {
    if (project.deliverables.length === 0) {
      console.log(`\n📦 Adding deliverables to: ${project.name}`);
      
      await prisma.deliverable.createMany({
        data: [
          {
            projectId: project.id,
            name: 'Phase 1: Planning',
            description: 'Initial planning and requirements gathering',
            type: 'REPORT',
            status: 'IN_PROGRESS',
            billingModel: 'FIXED_FEE',
            priceTotal: 25000,
            budgetHours: 200,
            budgetCost: 15000,
            percentComplete: 30,
          },
          {
            projectId: project.id,
            name: 'Phase 2: Development',
            description: 'Core development work',
            type: 'DASHBOARD',
            status: 'NOT_STARTED',
            billingModel: 'TIME_AND_MATERIALS',
            priceTotal: 50000,
            budgetHours: 500,
            budgetCost: 37500,
            percentComplete: 0,
          },
          {
            projectId: project.id,
            name: 'Phase 3: Deployment',
            description: 'Testing, deployment, and handover',
            type: 'OTHER',
            status: 'NOT_STARTED',
            billingModel: 'FIXED_FEE',
            priceTotal: 25000,
            budgetHours: 200,
            budgetCost: 15000,
            percentComplete: 0,
          },
        ]
      });
      
      console.log(`✅ Added 3 deliverables to ${project.name}`);
    } else {
      console.log(`✓ ${project.name} already has ${project.deliverables.length} deliverable(s)`);
    }
  }

  console.log('\n🎉 Done!');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


