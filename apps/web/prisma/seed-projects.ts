import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if there are any orgs
  const orgCount = await prisma.org.count();
  
  if (orgCount === 0) {
    console.log('❌ No orgs found. Please create an org first.');
    return;
  }

  // Get the first org
  const org = await prisma.org.findFirst();
  
  if (!org) {
    console.log('❌ Could not find org');
    return;
  }

  console.log(`✓ Found org: ${org.name} (${org.id})`);

  // Check if there are any projects
  const projectCount = await prisma.project.count({
    where: { orgId: org.id }
  });

  if (projectCount > 0) {
    console.log(`✓ Org already has ${projectCount} project(s). Skipping seed.`);
    return;
  }

  // Create a sample project
  console.log('📊 Creating sample project...');
  
  const project = await prisma.project.create({
    data: {
      orgId: org.id,
      name: 'Sample Engineering Project',
      clientName: 'Acme Corporation',
      description: 'A sample project to demonstrate the Gantt module',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      currency: 'USD',
      targetMarginPct: 25,
      priceTotal: 100000,
      deliverables: {
        create: [
          {
            name: 'System Architecture',
            description: 'Design and document the system architecture',
            type: 'REPORT',
            status: 'IN_PROGRESS',
            billingModel: 'FIXED_FEE',
            priceTotal: 25000,
            budgetHours: 200,
            budgetCost: 15000,
            percentComplete: 30,
          },
          {
            name: 'Frontend Development',
            description: 'Build the user interface and client-side logic',
            type: 'DASHBOARD',
            status: 'NOT_STARTED',
            billingModel: 'TIME_AND_MATERIALS',
            priceTotal: 40000,
            budgetHours: 400,
            budgetCost: 30000,
            percentComplete: 0,
          },
          {
            name: 'Backend API',
            description: 'Develop RESTful API and database schema',
            type: 'OTHER',
            status: 'NOT_STARTED',
            billingModel: 'FIXED_FEE',
            priceTotal: 35000,
            budgetHours: 350,
            budgetCost: 25000,
            percentComplete: 0,
          },
        ]
      }
    },
    include: {
      deliverables: true
    }
  });

  console.log(`✅ Created project: ${project.name} (${project.id})`);
  console.log(`✅ Created ${project.deliverables.length} deliverables`);
  console.log('\n🎉 Seed complete! You can now access the projects page.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





