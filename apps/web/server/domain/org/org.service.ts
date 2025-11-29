import * as orgRepo from './org.repo';
import type { CreateOrgLevel, UpdateOrgLevel, CreatePerson, UpdatePerson, UpdateUserRole } from './org.schema';
import { logAudit } from '@/lib/audit/logger';

// ========== OrgLevel Services ==========

export async function listOrgLevels(orgId: string) {
  return orgRepo.findOrgLevels(orgId);
}

export async function getOrgLevel(id: string, orgId: string) {
  const orgLevel = await orgRepo.findOrgLevelById(id, orgId);
  if (!orgLevel) {
    throw new Error('Organization level not found');
  }
  return orgLevel;
}

export async function createOrgLevelForOrg(
  orgId: string,
  data: CreateOrgLevel,
  actorId: string
) {
  const orgLevel = await orgRepo.createOrgLevel(orgId, data);

  await logAudit({
    orgId,
    actorId,
    action: 'ORG_LEVEL_CREATED',
    entityType: 'org_level',
    entityId: orgLevel.id,
    metadata: { name: data.name },
  });

  return orgLevel;
}

export async function updateOrgLevelForOrg(
  id: string,
  orgId: string,
  data: Omit<UpdateOrgLevel, 'id'>,
  actorId: string
) {
  const orgLevel = await orgRepo.updateOrgLevel(id, orgId, data);

  await logAudit({
    orgId,
    actorId,
    action: 'ORG_LEVEL_UPDATED',
    entityType: 'org_level',
    entityId: id,
    metadata: data,
  });

  return orgLevel;
}

export async function deleteOrgLevelForOrg(id: string, orgId: string, actorId: string) {
  const orgLevel = await orgRepo.findOrgLevelById(id, orgId);
  if (!orgLevel) {
    throw new Error('Organization level not found');
  }

  await orgRepo.deleteOrgLevel(id, orgId);

  await logAudit({
    orgId,
    actorId,
    action: 'ORG_LEVEL_DELETED',
    entityType: 'org_level',
    entityId: id,
    metadata: { name: orgLevel.name },
  });

  return { success: true };
}

// ========== Person Services ==========

export async function listPeople(orgId: string) {
  return orgRepo.findPeople(orgId);
}

export async function getPerson(id: string, orgId: string) {
  const person = await orgRepo.findPersonById(id, orgId);
  if (!person) {
    throw new Error('Person not found');
  }
  return person;
}

export async function createPersonForOrg(
  orgId: string,
  data: CreatePerson,
  actorId: string
) {
  // Validate that manager exists in same org if provided
  if (data.managerId) {
    const manager = await orgRepo.findPersonById(data.managerId, orgId);
    if (!manager) {
      throw new Error('Manager not found');
    }
  }

  // Validate that org level exists if provided
  if (data.orgLevelId) {
    const orgLevel = await orgRepo.findOrgLevelById(data.orgLevelId, orgId);
    if (!orgLevel) {
      throw new Error('Organization level not found');
    }
  }

  const person = await orgRepo.createPerson(orgId, data);

  await logAudit({
    orgId,
    actorId,
    action: 'PERSON_CREATED',
    entityType: 'person',
    entityId: person.id,
    metadata: { name: data.name },
  });

  return person;
}

export async function updatePersonForOrg(
  id: string,
  orgId: string,
  data: Omit<UpdatePerson, 'id'>,
  actorId: string
) {
  // Validate that manager exists in same org if provided
  if (data.managerId !== undefined && data.managerId !== null) {
    // Prevent circular references
    if (data.managerId === id) {
      throw new Error('A person cannot be their own manager');
    }
    
    const manager = await orgRepo.findPersonById(data.managerId, orgId);
    if (!manager) {
      throw new Error('Manager not found');
    }

    // Check for circular references (person A reports to person B who reports to person A)
    const isCircular = await checkCircularReference(data.managerId, id, orgId);
    if (isCircular) {
      throw new Error('Circular manager reference detected');
    }
  }

  // Validate that org level exists if provided
  if (data.orgLevelId !== undefined && data.orgLevelId !== null) {
    const orgLevel = await orgRepo.findOrgLevelById(data.orgLevelId, orgId);
    if (!orgLevel) {
      throw new Error('Organization level not found');
    }
  }

  const person = await orgRepo.updatePerson(id, orgId, data);

  await logAudit({
    orgId,
    actorId,
    action: 'PERSON_UPDATED',
    entityType: 'person',
    entityId: id,
    metadata: data,
  });

  return person;
}

export async function deletePersonForOrg(id: string, orgId: string, actorId: string) {
  const person = await orgRepo.findPersonById(id, orgId);
  if (!person) {
    throw new Error('Person not found');
  }

  await orgRepo.deletePerson(id, orgId);

  await logAudit({
    orgId,
    actorId,
    action: 'PERSON_DELETED',
    entityType: 'person',
    entityId: id,
    metadata: { name: person.name },
  });

  return { success: true };
}

// Helper function to check for circular manager references
async function checkCircularReference(
  managerId: string,
  personId: string,
  orgId: string
): Promise<boolean> {
  let currentManager = await orgRepo.findPersonById(managerId, orgId);
  const visited = new Set<string>([personId]);

  while (currentManager?.managerId) {
    if (visited.has(currentManager.managerId)) {
      return true; // Circular reference detected
    }
    visited.add(currentManager.managerId);
    currentManager = await orgRepo.findPersonById(currentManager.managerId, orgId);
  }

  return false;
}

// ========== Organization Hierarchy Services ==========

export interface HierarchyNode {
  person: Awaited<ReturnType<typeof orgRepo.findPersonById>>;
  reports: HierarchyNode[];
}

export async function getOrgHierarchy(orgId: string): Promise<HierarchyNode[]> {
  const allPeople = await orgRepo.findPeople(orgId);
  
  // Build a map for quick lookups
  const peopleMap = new Map(allPeople.map((p) => [p.id, { person: p, reports: [] as HierarchyNode[] }]));
  
  // Root nodes (people with no manager)
  const roots: HierarchyNode[] = [];
  
  // Build the tree
  for (const person of allPeople) {
    const node = peopleMap.get(person.id)!;
    
    if (!person.managerId) {
      roots.push(node);
    } else {
      const managerNode = peopleMap.get(person.managerId);
      if (managerNode) {
        managerNode.reports.push(node);
      } else {
        // If manager not found (shouldn't happen with proper constraints), treat as root
        roots.push(node);
      }
    }
  }
  
  return roots;
}

// ========== Admin/Role Management Services ==========

export async function listOrgUsers(orgId: string) {
  return orgRepo.findOrgUsers(orgId);
}

export async function updateUserRole(
  userId: string,
  orgId: string,
  role: UpdateUserRole['role'],
  actorId: string
) {
  // Check if user exists in org
  const userRole = await orgRepo.findUserOrgRole(userId, orgId);
  if (!userRole) {
    throw new Error('User not found in organization');
  }

  const updated = await orgRepo.updateUserOrgRole(userId, orgId, role);

  await logAudit({
    orgId,
    actorId,
    action: 'ORG_MEMBER_ROLE_CHANGED',
    entityType: 'user',
    entityId: userId,
    metadata: { oldRole: userRole.role, newRole: role },
  });

  return updated;
}







