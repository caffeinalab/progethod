import { ref, computed, watch, nextTick, type Ref, type ComputedRef } from 'vue'

export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036F]/g, '')
}

export function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = stripDiacritics(text.toLowerCase())
  const normalizedQuery = stripDiacritics(query.toLowerCase().trim())
  if (!normalizedQuery) return true
  if (normalizedText.includes(normalizedQuery)) return true

  const tokens = normalizedQuery.split(/\s+/)
  if (tokens.length > 1 && tokens.every(token => normalizedText.includes(token))) return true

  const initials = normalizedText.split(/[\s\-_.']+/).map(word => word[0]).filter(Boolean).join('')
  if (initials.includes(normalizedQuery)) return true

  return false
}

interface ProjectSearchOptions {
  query: Ref<string>
  localProjects: ComputedRef<any[]>
  wethodProjects: ComputedRef<any[]>
}

export function useProjectSearch(options: ProjectSearchOptions) {
  const { query, localProjects, wethodProjects } = options

  const highlightedIndex = ref(0)
  const optionRefs: Record<number, HTMLElement | null> = {}

  const normalizedQuery = computed(() => query.value.toLowerCase().trim())

  const filteredLocalProjects = computed(() => {
    if (!normalizedQuery.value) return localProjects.value.slice(0, 10)
    return localProjects.value.filter(
      (project: any) => fuzzyMatch(project.name, normalizedQuery.value),
    )
  })

  const nonAutomaticWethodProjects = computed(() =>
    wethodProjects.value.filter((project: any) => !project.isAutomatic),
  )

  const hasExactLocalMatch = computed(() => {
    if (!normalizedQuery.value) return false
    const stripped = stripDiacritics(normalizedQuery.value)
    return localProjects.value.some(
      (project: any) => stripDiacritics(project.name.toLowerCase()) === stripped,
    )
  })

  const showCreateOption = computed(() =>
    normalizedQuery.value.length > 0 && !hasExactLocalMatch.value,
  )

  const createOptionIndex = computed(() => filteredLocalProjects.value.length)

  const wethodFlatIndexStart = computed(() =>
    filteredLocalProjects.value.length + (showCreateOption.value ? 1 : 0),
  )

  const filteredWethodEntries = computed(() => {
    const entries: any[] = []
    let flatIndex = wethodFlatIndexStart.value
    const queryValue = normalizedQuery.value
    const projects = queryValue
      ? nonAutomaticWethodProjects.value
      : nonAutomaticWethodProjects.value.slice(0, 15)

    for (const project of projects) {
      const projectNameMatches = fuzzyMatch(project.name, queryValue)

      let areasToShow
      if (!queryValue || projectNameMatches) {
        areasToShow = project.areas
      } else {
        areasToShow = project.areas.filter((area: any) => {
          const combinedText = project.name + ' ' + (area.name || '')
          return fuzzyMatch(combinedText, queryValue)
        })
      }

      if (areasToShow.length === 0) continue

      entries.push({ isHeader: true, project })
      for (const area of areasToShow) {
        entries.push({ isHeader: false, project, area, flatIndex })
        flatIndex++
      }
    }

    return entries
  })

  const totalSelectableCount = computed(() => {
    const wethodAreaCount = filteredWethodEntries.value.filter((entry: any) => !entry.isHeader).length
    return filteredLocalProjects.value.length + (showCreateOption.value ? 1 : 0) + wethodAreaCount
  })

  watch(query, () => { highlightedIndex.value = 0 })

  function setOptionRef(index: number, element: any) {
    optionRefs[index] = element as HTMLElement | null
  }

  function flatIndexForLocal(localIndex: number): number {
    return localIndex
  }

  function moveHighlight(delta: number) {
    const total = totalSelectableCount.value
    if (total === 0) return
    highlightedIndex.value = (highlightedIndex.value + delta + total) % total
    scrollHighlightedIntoView()
  }

  function scrollHighlightedIntoView() {
    nextTick(() => {
      const element = optionRefs[highlightedIndex.value]
      element?.scrollIntoView?.({ block: 'nearest' })
    })
  }

  function resetHighlight() {
    highlightedIndex.value = 0
  }

  return {
    normalizedQuery,
    filteredLocalProjects,
    filteredWethodEntries,
    totalSelectableCount,
    showCreateOption,
    createOptionIndex,
    highlightedIndex,
    moveHighlight,
    scrollHighlightedIntoView,
    resetHighlight,
    setOptionRef,
    flatIndexForLocal,
  }
}
