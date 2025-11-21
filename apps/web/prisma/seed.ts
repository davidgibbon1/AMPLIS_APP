import { PrismaClient, ProjectStatus, DeliverableStatus, DeliverableType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Org (using fixed ID to match mock context)
  const org = await prisma.org.upsert({
    where: { id: 'org_mock_1' },
    update: {},
    create: {
      id: 'org_mock_1',
      name: 'Acme Engineering',
      slug: 'acme-engineering',
    },
  });

  // 2. Create User & Person (using fixed ID to match mock context)
  const user = await prisma.user.upsert({
    where: { id: 'user_mock_1' },
    update: {},
    create: {
      id: 'user_mock_1',
      email: 'demo@amplis.app',
      name: 'Demo User',
      orgRoles: {
        create: {
          orgId: org.id,
          role: Role.OWNER,
        },
      },
    },
  });

  const person = await prisma.person.create({
    data: {
      orgId: org.id,
      userId: user.id,
      name: 'Demo User',
      role: 'Principal Engineer',
      defaultRate: 150, // Cost rate
      billRate: 250,
    },
  });

  // 3. Create Projects

  // Project A: Healthy
  const projA = await prisma.project.create({
    data: {
      orgId: org.id,
      name: 'Alpha Tower Structural Audit',
      clientName: 'Skyline Properties',
      status: ProjectStatus.ACTIVE,
      targetMarginPct: 25,
      priceTotal: 0, // Sum of deliverables
      deliverables: {
        create: [
          {
            name: 'Site Inspection',
            type: DeliverableType.WORKSHOP,
            status: DeliverableStatus.COMPLETED,
            priceTotal: 5000,
            budgetHours: 20,
            budgetCost: 3000,
            percentComplete: 100,
            actualHours: 18,
            actualCost: 2700,
          },
          {
            name: 'Structural Analysis Model',
            type: DeliverableType.MODEL,
            status: DeliverableStatus.IN_PROGRESS,
            priceTotal: 15000,
            budgetHours: 60,
            budgetCost: 9000,
            percentComplete: 40,
            actualHours: 20,
            actualCost: 3000,
          },
          {
            name: 'Final Report',
            type: DeliverableType.REPORT,
            status: DeliverableStatus.NOT_STARTED,
            priceTotal: 5000,
            budgetHours: 20,
            budgetCost: 3000,
            percentComplete: 0,
          },
        ],
      },
    },
  });

  // Project B: At Risk
  const projB = await prisma.project.create({
    data: {
      orgId: org.id,
      name: 'Beta Bridge Remediation',
      clientName: 'City Council',
      status: ProjectStatus.ACTIVE,
      targetMarginPct: 20,
      deliverables: {
        create: [
          {
            name: 'Phase 1 Designs',
            type: DeliverableType.OTHER,
            status: DeliverableStatus.IN_PROGRESS,
            priceTotal: 20000,
            budgetHours: 80,
            budgetCost: 12000,
            percentComplete: 50,
            actualHours: 90, // Over budget already
            actualCost: 13500,
          },
        ],
      },
    },
  });

  // 4. Create Timesheets (Sample)
  await prisma.timesheet.create({
    data: {
      projectId: projA.id,
      personId: person.id,
      date: new Date(),
      hours: 4,
      notes: 'Initial analysis setup',
      costRateAtTime: 150,
    },
  });

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

