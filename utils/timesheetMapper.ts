import { minutesToHHmm } from './duration'
import { TranslatableError } from './localizableErrors'

function convertAreaId(areaId: unknown): number | string | null {
  if (!areaId || areaId === 'null') { return null }
  if (typeof areaId === 'string' && areaId.match(/^[0-9]+$/)) { return parseInt(areaId) }
  return areaId as string
}

function normalizeAreaId(areaId: unknown): string | number | null {
  if (areaId == null || areaId === 'null') { return null }
  return areaId as string | number
}

function areaExists(areas: Array<{ id: unknown }>, areaId: unknown): boolean {
  const normalized = normalizeAreaId(areaId)
  return areas.some(area => normalizeAreaId(area.id) === normalized)
}

function resolveEntryIds(data: any, userProjects: any[], linkedProjects: any[]) {
  if (data.directWethodProjectId) {
    const linkedProject = linkedProjects.find(project => project.id === data.directWethodProjectId)
    const displayName = linkedProject?.name || `#${data.directWethodProjectId}`
    if (!linkedProject) { throw new TranslatableError('errors.linked_project_not_found', { project: displayName }) }
    if (linkedProject.isAutomatic) { return null }
    const areaId = data.directWethodAreaId || 'null'
    if (!areaExists(linkedProject.areas, areaId)) { throw new TranslatableError('errors.linked_area_not_found', { project: displayName }) }
    return { linkedProjectId: data.directWethodProjectId, linkedAreaId: areaId, name: displayName }
  }

  const { linkedProjectId, linkedAreaId = 'null', name } = userProjects.find(project => project.id === data.project?.id) || {} as any
  if (!linkedProjectId) { throw new TranslatableError('errors.linked_project_not_found', { project: name }) }
  const linkedProject = linkedProjects.find(project => project.id === linkedProjectId)
  if (!linkedProject) { throw new TranslatableError('errors.linked_project_not_found', { project: name }) }
  if (linkedProject.isAutomatic) { return null }
  if (!areaExists(linkedProject.areas, linkedAreaId)) { throw new TranslatableError('errors.linked_area_not_found', { project: name }) }
  return { linkedProjectId, linkedAreaId, name }
}

function decimalAdd(n1: number, n2: number): number {
  return ((n1 * 10) + (n2 * 10)) / 10
}

function mergeEntries(entries: any[], userProjects: any[], linkedProjects: any[]) {
  const projects: Record<string, any> = {}

  entries
    .filter(({ data }) => data.duration > 0)
    .forEach(({ id, data }) => {
      const resolved = resolveEntryIds(data, userProjects, linkedProjects)
      if (!resolved) { return }
      const { linkedProjectId, linkedAreaId, name } = resolved

      if (!projects[linkedProjectId]) { projects[linkedProjectId] = {} }
      const project = projects[linkedProjectId]

      if (!project[linkedAreaId]) {
        project[linkedAreaId] = {
          decimal_duration: { internal: 0, remote: 0, travel: 0, overtime: 0, night_shift: 0 },
          notes: [],
          internal_ids: [],
          debugProjectName: name,
        }
      }

      const area = project[linkedAreaId]

      switch (data.location) {
        case 'office': area.decimal_duration.internal = decimalAdd(area.decimal_duration.internal, data.decimal_duration); break
        case 'travel': area.decimal_duration.travel = decimalAdd(area.decimal_duration.travel, data.decimal_duration); break
        case 'overtime': area.decimal_duration.overtime = decimalAdd(area.decimal_duration.overtime, data.decimal_duration); break
        case 'night_shift': area.decimal_duration.night_shift = decimalAdd(area.decimal_duration.night_shift, data.decimal_duration); break
        default: area.decimal_duration.remote = decimalAdd(area.decimal_duration.remote, data.decimal_duration)
      }

      area.notes.push(`- ${data.notes || '%'} *${minutesToHHmm(data.duration)}* #${id}`)
      area.internal_ids.push(id)
    })

  return projects
}

export function prepareForCleanup(projects: any[], employeeId: number) {
  const getCleanArea = (areaId: unknown) => ({
    area_id: areaId,
    types: { internal: null, remote: null, travel: null, overtime: null, night_shift: null },
  })

  return projects
    .map((project) => {
      const hours: any[] = []
      project.areas.forEach((area: any) => {
        if (area.notes) {
          hours.push(getCleanArea(area.id))
          return
        }
        if (Object.values(area.hours).some((value: any) => value !== null)) {
          hours.push(getCleanArea(area.id))
        }
      })
      return { project_id: project.id, date: project.date, employee_id: employeeId, hours }
    })
    .filter((project) => project.hours.length > 0)
}

export function prepareForSubmission(dayEntries: any[], userProjects: any[], linkedProjects: any[], employeeId: number) {
  return dayEntries
    .map(({ entries, day }) => ({ day, projects: mergeEntries(entries, userProjects, linkedProjects) }))
    .map(({ day, projects }) => {
      return Object.keys(projects).map((projectId) => {
        const project = projects[projectId]
        const internalIds = Object.values(project).map((area: any) => area.internal_ids).reduce((acc: any[], ids) => acc.concat(ids), [])
        return {
          project_id: parseInt(projectId),
          employee_id: employeeId,
          date: day,
          hours: Object.keys(project).map(areaId => ({
            area_id: convertAreaId(areaId),
            types: {
              internal: project[areaId].decimal_duration.internal || null,
              remote: project[areaId].decimal_duration.remote || null,
              travel: project[areaId].decimal_duration.travel || null,
              overtime: project[areaId].decimal_duration.overtime || null,
              night_shift: project[areaId].decimal_duration.night_shift || null,
            },
            notes: project[areaId].notes.join('\n'),
          })),
          internalIds,
          debugProjectName: Object.values(project).pop()?.debugProjectName,
        }
      })
    })
    .reduce((acc: any[], day) => acc.concat(day), [])
}
