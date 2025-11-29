import { prisma } from '@/lib/db/client';
import { LogTimeInput } from './timesheet.schema';

export const logTime = async (orgId: string, input: LogTimeInput) => {
  const { projectId, deliverableId, personId, date, hours, notes, costRateOverride } = input;

  // 1. Get Person's cost rate if not provided
  let rate = costRateOverride || 0;
  if (!rate) {
    const person = await prisma.person.findUnique({
      where: { id: personId },
    });
    if (person) {
      rate = person.defaultRate.toNumber();
    }
  }

  const cost = hours * rate;

  // 2. Create Timesheet
  const timesheet = await prisma.timesheet.create({
    data: {
      projectId,
      deliverableId,
      personId,
      date,
      hours,
      notes,
      costRateAtTime: rate,
    },
  });

  // 3. Update Deliverable Actuals (if linked)
  if (deliverableId) {
    await prisma.deliverable.update({
      where: { id: deliverableId },
      data: {
        actualHours: { increment: hours },
        actualCost: { increment: cost },
      },
    });
  }

  // 4. Update Project Actuals? (Usually aggregated on read, but could be cached)
  // We'll stick to read-time aggregation for Project level to avoid sync issues for now.

  return timesheet;
};

export const getRecentTimesheets = async (projectId: string) => {
  return prisma.timesheet.findMany({
    where: { projectId },
    orderBy: { date: 'desc' },
    take: 10,
    include: {
      person: { select: { name: true } },
      deliverable: { select: { name: true } }
    }
  });
};


