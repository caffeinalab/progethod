/** Magic Tag format: [progethod:{wethodProjectId}:{areaId|generic}] */

const MAGIC_TAG_PATTERN = /\[progethod:(\d+):(generic|\d+|uid_[a-z0-9]+)\]/g

export interface ParsedMagicTag {
  projectId: number
  /** null means the tag used `generic` (no specific area). */
  areaId: string | number | null
}

export type MagicTagResolution =
  | { kind: 'local'; project: any }
  | { kind: 'wethod'; projectId: number; areaId: string | number | null }
  | null

function normalizeAreaId(areaId: unknown): string | null {
  if (areaId == null || areaId === '' || areaId === 'null' || areaId === 'generic') {
    return null
  }
  return String(areaId)
}

export function formatMagicTag(projectId: number, areaId?: string | number | null): string {
  const areaPart = normalizeAreaId(areaId) ?? 'generic'
  return `[progethod:${projectId}:${areaPart}]`
}

export function parseMagicTag(description: string | null | undefined): ParsedMagicTag | null {
  if (!description) {
    return null
  }
  const matches = Array.from(description.matchAll(MAGIC_TAG_PATTERN))
  if (matches.length < 1) {
    return null
  }
  const [, projectIdString, areaIdString] = matches[0]
  return {
    projectId: parseInt(projectIdString, 10),
    areaId: areaIdString === 'generic' ? null : areaIdString,
  }
}

function areaIdsMatch(left: unknown, right: unknown): boolean {
  return normalizeAreaId(left) === normalizeAreaId(right)
}

function findLocalProject(
  localProjects: any[],
  projectId: number,
  areaId: string | number | null,
) {
  return localProjects.find(
    project => project.linkedProjectId === projectId && areaIdsMatch(project.linkedAreaId, areaId),
  ) || null
}

function findWethodTarget(
  wethodProjects: any[],
  projectId: number,
  areaId: string | number | null,
): { projectId: number; areaId: string | number | null } | null {
  const wethodProject = wethodProjects.find(project => project.id === projectId)
  if (!wethodProject || wethodProject.isAutomatic) {
    return null
  }

  if (areaId == null) {
    return { projectId, areaId: null }
  }

  const matchingArea = (wethodProject.areas || []).find(
    (area: { id: unknown }) => areaIdsMatch(area.id, areaId),
  )
  if (!matchingArea) {
    return null
  }

  return { projectId, areaId: matchingArea.id }
}

/**
 * Resolve a calendar description Magic Tag.
 * Prefers a local shortcut; otherwise a cached Wethod project/area; otherwise null (leave unassigned).
 */
export function resolveMagicTag(
  description: string | null | undefined,
  localProjects: any[],
  wethodProjects: any[],
): MagicTagResolution {
  const parsed = parseMagicTag(description)
  if (!parsed) {
    return null
  }

  const localProject = findLocalProject(localProjects, parsed.projectId, parsed.areaId)
  if (localProject) {
    return { kind: 'local', project: localProject }
  }

  const wethodTarget = findWethodTarget(wethodProjects, parsed.projectId, parsed.areaId)
  if (wethodTarget) {
    return { kind: 'wethod', projectId: wethodTarget.projectId, areaId: wethodTarget.areaId }
  }

  return null
}
