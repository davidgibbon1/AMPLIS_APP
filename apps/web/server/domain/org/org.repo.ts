import { prisma } from '@/lib/db/client';
import type { CreateOrgLevel, UpdateOrgLevel, CreatePerson, UpdatePerson } from './org.schema';

// ========== OrgLevel Repository ==========

export async function findOrgLevels(orgId: string) {
  return prisma.orgLevel.findMany({
    where: { orgId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { people: true },
      },
    },
  });
}

export async function findOrgLevelById(id: string, orgId: string) {
  return prisma.orgLevel.findFirst({
    where: { id, orgId },
    include: {
      people: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createOrgLevel(orgId: string, data: CreateOrgLevel) {
  return prisma.orgLevel.create({
    data: {
      ...data,
      orgId,
    },
  });
}

export async function updateOrgLevel(id: string, orgId: string, data: Omit<UpdateOrgLevel, 'id'>) {
  return prisma.orgLevel.update({
    where: { id, orgId },
    data,
  });
}

export async function deleteOrgLevel(id: string, orgId: string) {
  // First, unlink all people from this org level
  await prisma.person.updateMany({
    where: { orgLevelId: id, orgId },
    data: { orgLevelId: null },
  });

  return prisma.orgLevel.delete({
    where: { id, orgId },
  });
}

// ========== Person Repository ==========

export async function findPeople(orgId: string) {
  return prisma.person.findMany({
    where: { orgId },
    include: {
      orgLevel: {
        select: {
          id: true,
          name: true,
          order: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
        },
      },
      reports: {
        select: {
          id: true,
          name: true,
          email: true,
          orgLevel: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          reports: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function findPersonById(id: string, orgId: string) {
  return prisma.person.findFirst({
    where: { id, orgId },
    include: {
      orgLevel: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reports: {
        select: {
          id: true,
          name: true,
          email: true,
          orgLevel: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function createPerson(orgId: string, data: CreatePerson) {
  return prisma.person.create({
    data: {
      ...data,
      orgId,
    },
    include: {
      orgLevel: true,
      manager: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function updatePerson(id: string, orgId: string, data: Omit<UpdatePerson, 'id'>) {
  return prisma.person.update({
    where: { id, orgId },
    data,
    include: {
      orgLevel: true,
      manager: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function deletePerson(id: string, orgId: string) {
  // Update any people who report to this person to have no manager
  await prisma.person.updateMany({
    where: { managerId: id, orgId },
    data: { managerId: null },
  });

  return prisma.person.delete({
    where: { id, orgId },
  });
}

// ========== User Role Management ==========

export async function findUserOrgRole(userId: string, orgId: string) {
  return prisma.userOrgRole.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });
}

export async function findOrgUsers(orgId: string) {
  return prisma.userOrgRole.findMany({
    where: { orgId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      user: {
        name: 'asc',
      },
    },
  });
}

export async function updateUserOrgRole(userId: string, orgId: string, role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER') {
  return prisma.userOrgRole.update({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
    data: { role },
  });
}




