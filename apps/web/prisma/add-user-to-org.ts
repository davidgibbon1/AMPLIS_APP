import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'b0174744-7ccf-4657-9ea5-e10ffe591f50';
  
  // Find first org
  const org = await prisma.org.findFirst();
  
  if (!org) {
    console.log('❌ No org found in database');
    return;
  }
  
  console.log(`Found org: ${org.name} (${org.id})`);
  
  // Check if user already has membership
  const existing = await prisma.userOrgRole.findFirst({
    where: { userId, orgId: org.id }
  });
  
  if (existing) {
    console.log('✓ User already has org membership');
  } else {
    await prisma.userOrgRole.create({
      data: {
        userId,
        orgId: org.id,
        role: 'OWNER'
      }
    });
    console.log(`✅ Added user to org: ${org.name} as OWNER`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



