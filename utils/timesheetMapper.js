import { minutesToHHmm } from './duration'
import { TranslatableError } from './localizableErrors'

function convertAreaId (areaId) {
  if (!areaId || areaId === 'null') {
    return null
  }

  if (areaId.match(/^[0-9]{1,}$/)) {
    return parseInt(areaId)
  }

  return areaId
}

export function prepareForSubmission (dayEntries, userProjects, linkedProjects, employeeId) {
  return dayEntries
    .map(({ entries, day }) => ({ day, projects: mergeEntries(entries, userProjects, linkedProjects) }))
    .map(({ day, projects }) => {
      return Object.keys(projects).map((projectId) => {
        const project = projects[projectId]
        const internalIds = Object.values(project)
          .map(area => area.internal_ids)
          .reduce((acc, ids) => acc.concat(ids), [])

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
              night_shift: project[areaId].decimal_duration.night_shift || null
            },
            // eslint-disable-next-line quotes
            notes: project[areaId].notes.join("\n")
          })),
          internalIds,
          debugProjectName: Object.values(project).pop().debugProjectName
        }
      })
    })
    .reduce((acc, day) => acc.concat(day), [])
}

function resolveEntryIds (data, userProjects, linkedProjects) {
  if (data.directWethodProjectId) {
    const linkedProject = linkedProjects.find(project => project.id === data.directWethodProjectId)
    const displayName = linkedProject?.name || `#${data.directWethodProjectId}`

    if (!linkedProject) {
      throw new TranslatableError('errors.linked_project_not_found', { project: displayName })
    }
    if (linkedProject.isAutomatic) {
      return null
    }

    const areaId = data.directWethodAreaId || 'null'
    if (!linkedProject.areas.find(area => area.id === areaId)) {
      throw new TranslatableError('errors.linked_area_not_found', { project: displayName })
    }

    return { linkedProjectId: data.directWethodProjectId, linkedAreaId: areaId, name: displayName }
  }

  const { linkedProjectId, linkedAreaId = 'null', name } = userProjects.find(project => project.id === data.project?.id) || {}
  if (!linkedProjectId) {
    throw new TranslatableError('errors.linked_project_not_found', { project: name })
  }

  const linkedProject = linkedProjects.find(project => project.id === linkedProjectId)
  if (!linkedProject) {
    throw new TranslatableError('errors.linked_project_not_found', { project: name })
  }
  if (linkedProject.isAutomatic) {
    return null
  }
  if (!linkedProject.areas.find(area => area.id === linkedAreaId)) {
    throw new TranslatableError('errors.linked_area_not_found', { project: name })
  }

  return { linkedProjectId, linkedAreaId, name }
}

function mergeEntries (entries, userProjects, linkedProjects) {
  const projects = {}

  entries
    .filter(({ data }) => data.duration > 0)
    .forEach(({ id, data }) => {
      const resolved = resolveEntryIds(data, userProjects, linkedProjects)
      if (!resolved) { return }

      const { linkedProjectId, linkedAreaId, name } = resolved

      if (!projects[linkedProjectId]) {
        projects[linkedProjectId] = {}
      }

      const project = projects[linkedProjectId]

      if (!project[linkedAreaId]) {
        project[linkedAreaId] = {
          decimal_duration: {
            internal: 0,
            remote: 0,
            travel: 0,
            overtime: 0,
            night_shift: 0
          },
          notes: [],
          internal_ids: [],
          debugProjectName: name
        }
      }

      const area = project[linkedAreaId]

      switch (data.location) {
        case 'office':
          area.decimal_duration.internal = decimalAdd(area.decimal_duration.internal, data.decimal_duration)
          break
        case 'travel':
          area.decimal_duration.travel = decimalAdd(area.decimal_duration.travel, data.decimal_duration)
          break
        case 'overtime':
          area.decimal_duration.overtime = decimalAdd(area.decimal_duration.overtime, data.decimal_duration)
          break
        case 'night_shift':
          area.decimal_duration.night_shift = decimalAdd(area.decimal_duration.night_shift, data.decimal_duration)
          break
        case 'home':
        default:
          area.decimal_duration.remote = decimalAdd(area.decimal_duration.remote, data.decimal_duration)
      }

      area.notes.push(`- ${data.notes || '%'} *${minutesToHHmm(data.duration)}* #${id}`)
      area.internal_ids.push(id)
    })

  return projects
}

function decimalAdd (n1, n2) {
  return ((n1 * 10) + (n2 * 10)) / 10
}

export function prepareForCleanup (projects, employeeId) {
  const getCleanArea = (areaId) => {
    return {
      area_id: areaId,
      types: {
        internal: null,
        remote: null,
        travel: null,
        overtime: null,
        night_shift: null
      }
    }
  }

  // find all the stuff that needs to be deleted
  return projects
    .map((p) => {
      const hours = []

      p.areas.forEach((a) => {
        if (a.notes) {
          hours.push(getCleanArea(a.id))
          return
        }

        if (Object.values(a.hours).some(v => v !== null)) {
          hours.push(getCleanArea(a.id))
        }
      })

      return {
        project_id: p.id,
        date: p.date,
        employee_id: employeeId,
        hours
      }
    })
    .filter(p => p.hours.length > 0)
}
