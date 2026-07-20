<template>
  <div class="contents">
    <!-- Status icon column -->
    <div class="flex items-center justify-center w-full h-full">
      <template v-if="selection">
        <NuxtLink
          v-if="selection.type === 'local'"
          :to="{ name: 'projects-id', params: { id: selection.localProject.id } }"
        >
          <IconAlertTriangle v-if="!isSelectionLinked" class="text-warning" :size="16" />
          <IconExternalLink v-if="isSelectionLinked" class="text-ink-faint" :size="16" />
        </NuxtLink>
        <IconCheck v-else-if="selection.type === 'wethod'" class="text-success" :size="16" />
      </template>
    </div>

    <!-- Unified project search -->
    <div ref="projectColumn" class="w-full h-full relative" @keydown.escape="escapeField">
      <!-- Search input (visible when editing or nothing selected) -->
      <input
        v-if="editing"
        ref="searchInput"
        v-model="searchQuery"
        class="text-ink focus:outline-none focus:border focus:border-accent bg-card font-normal w-full h-10 flex items-center pl-3 text-sm border-stroke rounded-lg border shadow"
        :placeholder="$t('select_project')"
        :disabled="disabled"
        @focus="openDropdown"
        @input="openDropdown"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.tab="closeDropdown"
      >

      <!-- Selected display (clickable to re-open) -->
      <button
        v-else-if="selection"
        class="group relative w-full h-10 pl-3 pr-2 text-sm text-left text-ink border rounded-lg shadow bg-card flex items-center gap-1 transition-colors"
        :class="disabled
          ? 'border-stroke-muted text-ink-disabled cursor-default'
          : 'border-stroke hover:border-accent cursor-text'"
        :disabled="disabled"
        @click="startEditing"
      >
        <span class="flex-1 min-w-0">
          <template v-if="selection.type === 'local'">
            <span class="flex items-center gap-1 min-w-0 overflow-hidden">
              <span class="font-medium truncate shrink-0 grow-0 max-w-full">{{ selection.localProject.name }}</span>
              <span v-if="selection.resolvedLabel" class="text-ink-faint text-xs truncate min-w-0">&rarr; {{ selection.resolvedLabel }}</span>
            </span>
          </template>
          <template v-else>
            <span class="block text-sm font-medium truncate leading-tight">{{ selection.wethodProjectName }}</span>
            <span class="block text-xs text-ink-faint truncate leading-tight">{{ selection.wethodAreaName }}</span>
          </template>
        </span>

        <IconChevronDown v-if="!disabled" class="flex-shrink-0 text-ink-faint" :size="16" />

        <div class="selection-tooltip absolute z-50 left-0 top-full mt-1 px-3 py-2 bg-card text-ink text-xs rounded-lg border border-stroke shadow-xl pointer-events-none whitespace-nowrap">
          <template v-if="selection.type === 'local'">
            <div class="font-semibold text-sm">{{ selection.localProject.name }}</div>
            <template v-if="tooltipWethodInfo">
              <div class="border-t border-stroke-muted my-1.5" />
              <div class="text-ink-secondary"><span class="text-ink-faint">Progetto:</span> {{ tooltipWethodInfo.projectName }}</div>
              <div class="text-ink-secondary mt-0.5"><span class="text-ink-faint">Area:</span> {{ tooltipWethodInfo.areaName }}</div>
            </template>
          </template>
          <template v-else-if="selection.type === 'wethod'">
            <div class="font-semibold text-sm">{{ selection.wethodProjectName }}</div>
            <div class="text-ink-secondary mt-0.5">{{ selection.wethodAreaName }}</div>
          </template>
        </div>
      </button>

      <!-- Dropdown -->
      <div
        v-if="dropdownOpen && editing && !disabled"
        class="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-stroke-muted rounded-lg shadow-lg max-h-72 overflow-y-auto"
        style="min-width: 20rem"
      >
        <!-- Local projects -->
        <div v-if="filteredLocalProjects.length" class="p-1">
          <div class="px-3 py-1.5 text-xs font-bold text-ink-faint uppercase tracking-wider">
            {{ $t('projects') }}
          </div>
          <button
            v-for="(localProject, localIndex) in filteredLocalProjects"
            :key="'local-' + localProject.id"
            :ref="(element) => setOptionRef(flatIndexForLocal(localIndex), element)"
            class="w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors"
            :class="highlightedIndex === flatIndexForLocal(localIndex) ? 'bg-accent-soft' : 'hover:bg-card-hover'"
            @click="selectLocalProject(localProject)"
            @mouseenter="highlightedIndex = flatIndexForLocal(localIndex)"
          >
            <span class="font-medium text-ink truncate">{{ localProject.name }}</span>
            <IconAlertTriangle v-if="!localProject.linkedProjectId" class="text-warning flex-shrink-0" :size="14" />
          </button>
        </div>

        <!-- Create new (when no exact local match) -->
        <div v-if="showCreateOption" class="p-1">
          <button
            :ref="(element) => setOptionRef(createOptionIndex, element)"
            class="w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors"
            :class="highlightedIndex === createOptionIndex ? 'bg-accent-soft' : 'hover:bg-card-hover'"
            @click="createLocalProject"
            @mouseenter="highlightedIndex = createOptionIndex"
          >
            <IconPlus :size="14" class="text-accent-fg" />
            <span class="text-accent-fg">{{ $t('create_project_inline', { name: searchQuery.trim() }) }}</span>
          </button>
        </div>

        <!-- Divider -->
        <div v-if="(filteredLocalProjects.length || showCreateOption) && filteredWethodEntries.length" class="border-t border-stroke-muted my-1" />

        <!-- Wethod projects + areas -->
        <div v-if="filteredWethodEntries.length" class="p-1">
          <div class="px-3 py-1.5 text-xs font-bold text-ink-faint uppercase tracking-wider">
            Wethod
          </div>
          <template v-for="item in filteredWethodEntries" :key="item.isHeader ? 'wh-' + item.project.id : 'wha-' + item.project.id + '-' + item.area.id">
            <div
              v-if="item.isHeader"
              class="px-3 py-1.5 text-sm font-medium text-ink-muted truncate"
            >
              {{ item.project.name }}
            </div>
            <button
              v-else
              :ref="(element) => setOptionRef(item.flatIndex, element)"
              class="w-full text-left pl-7 pr-3 py-1.5 text-sm rounded flex items-center gap-2 transition-colors"
              :class="highlightedIndex === item.flatIndex ? 'bg-accent-soft' : 'hover:bg-card-hover'"
              @click="selectWethodArea(item.project, item.area)"
              @mouseenter="highlightedIndex = item.flatIndex"
            >
              <span class="text-ink-faint">&bull;</span>
              <span class="text-ink-secondary">{{ item.area.name || 'Generico' }}</span>
            </button>
          </template>
        </div>

        <!-- No results -->
        <div v-if="!filteredLocalProjects.length && !filteredWethodEntries.length && !showCreateOption" class="px-3 py-4 text-sm text-ink-faint text-center">
          {{ $t('select_project') }}
        </div>
      </div>
    </div>

    <!-- Duration -->
    <div>
      <DurationInput
        ref="durationRef"
        :model-value="duration"
        :disabled="disabled"
        @update:model-value="onDurationChange"
        @user-submit="handleSubmit"
      />
    </div>

    <!-- Notes -->
    <div class="w-full relative">
      <input
        ref="notesInput"
        v-model="notes"
        class="text-ink focus:outline-none focus:border focus:border-accent bg-card font-normal w-full h-10 flex items-center pl-3 text-sm border-stroke rounded-lg border shadow"
        :class="{ 'text-ink-disabled': disabled, 'text-ink-secondary': !disabled }"
        placeholder="Notes"
        :disabled="disabled"
        @input="onNotesInput"
        @keydown.enter="handleNotesEnter"
        @keydown.escape="escapeField"
        @focus="notesFocused = true"
        @blur="handleNotesBlur"
        @keydown.down.prevent="enterPresetsSelector"
        @keydown="handleNotesKeydown"
      >
      <!-- Preset suggestions -->
      <div
        v-if="showPresets || quickCreateActive"
        class="absolute z-40 left-0 top-full mt-1 flex flex-wrap items-center gap-1.5 p-2 bg-card border border-stroke-muted rounded-lg shadow-md max-w-md"
      >
        <button
          v-for="(preset, presetIndex) in visiblePresets"
          :key="preset.id"
          class="px-2.5 py-1 text-xs font-medium rounded-full transition-colors border whitespace-nowrap"
          :class="presetsNavigating && highlightedPresetIndex === presetIndex
            ? 'bg-accent-soft text-accent-fg border-accent'
            : 'bg-card-dim text-ink-secondary border-stroke-muted hover:bg-accent-soft hover:text-accent-fg hover:border-accent'"
          @mousedown.prevent="selectPreset(preset)"
        >
          {{ preset.label }}
        </button>
        <!-- Quick create -->
        <div v-if="quickCreateActive" class="flex items-center gap-1">
          <input
            ref="quickCreateInput"
            v-model="quickCreateLabel"
            class="px-2 py-0.5 text-xs border border-accent rounded-full w-24 focus:outline-none focus:border-accent-hover text-ink bg-card"
            placeholder="..."
            @keydown.enter.prevent="confirmQuickCreate"
            @keydown.escape.prevent="cancelQuickCreate"
            @blur="cancelQuickCreate"
          >
        </div>
        <button
          v-else
          class="px-2.5 py-1 text-xs font-medium rounded-full border border-dashed transition-colors whitespace-nowrap"
          :class="presetsNavigating && highlightedPresetIndex >= visiblePresets.length
            ? 'border-accent text-accent-fg bg-accent-soft'
            : 'border-stroke text-ink-faint hover:border-accent hover:text-accent-fg'"
          @mousedown.prevent="startQuickCreate"
        >
          +
        </button>
      </div>
    </div>

    <!-- Location -->
    <div class="flex justify-center items-center" :title="$t('work_location')">
      <LocationInput :model-value="location" :disabled="disabled" @update:model-value="onLocationChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { IconAlertTriangle, IconExternalLink, IconCheck, IconPlus, IconChevronDown } from '@tabler/icons-vue'

const { t: $t } = useI18n()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiDataStore = useApiDataStore()
const presetsStore = usePresetsStore()

const props = defineProps<{
  modelValue: Record<string, any>
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  'userSubmit': []
}>()

const searchInput = ref<HTMLInputElement | null>(null)
const notesInput = ref<HTMLInputElement | null>(null)
const durationRef = ref<any>(null)
const quickCreateInput = ref<HTMLInputElement | null>(null)
const projectColumn = ref<HTMLElement | null>(null)
const optionRefs: Record<number, HTMLElement | null> = {}

function setOptionRef(index: number, element: any) {
  optionRefs[index] = element as HTMLElement | null
}

const duration = ref(0)
const notes = ref('')
const location = ref('home')
const searchQuery = ref('')
const editing = ref(true)
const dropdownOpen = ref(false)
const highlightedIndex = ref(0)
const selection = ref<any>(null)
const notesFocused = ref(false)
const presetsNavigating = ref(false)
const highlightedPresetIndex = ref(0)
const quickCreateActive = ref(false)
const quickCreateLabel = ref('')

const visibleProjects = computed(() => projectsStore.visibleProjects)
const wethodProjects = computed(() => apiDataStore.projects)
const visiblePresets = computed(() => presetsStore.visiblePresets)

const showPresets = computed(() =>
  notesFocused.value && !notes.value && visiblePresets.value.length > 0 && !props.disabled
)

const isSelectionLinked = computed(() =>
  selection.value?.type === 'local' && selection.value.localProject.linkedProjectId
)

const normalizedQuery = computed(() => searchQuery.value.toLowerCase().trim())

const filteredLocalProjects = computed(() => {
  if (!normalizedQuery.value) return visibleProjects.value.slice(0, 10)
  return visibleProjects.value.filter(
    (project: any) => fuzzyMatch(project.name, normalizedQuery.value)
  )
})

const nonAutomaticWethodProjects = computed(() =>
  wethodProjects.value.filter((project: any) => !project.isAutomatic)
)

const createOptionIndex = computed(() => filteredLocalProjects.value.length)

const wethodFlatIndexStart = computed(() =>
  filteredLocalProjects.value.length + (showCreateOption.value ? 1 : 0)
)

const filteredWethodEntries = computed(() => {
  const entries: any[] = []
  let flatIndex = wethodFlatIndexStart.value
  const query = normalizedQuery.value
  const projects = query ? nonAutomaticWethodProjects.value : nonAutomaticWethodProjects.value.slice(0, 15)

  for (const project of projects) {
    const projectNameMatches = fuzzyMatch(project.name, query)

    let areasToShow
    if (!query || projectNameMatches) {
      areasToShow = project.areas
    } else {
      areasToShow = project.areas.filter((area: any) => {
        const combinedText = project.name + ' ' + (area.name || '')
        return fuzzyMatch(combinedText, query)
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

const hasExactLocalMatch = computed(() => {
  if (!normalizedQuery.value) return false
  const stripped = stripDiacritics(normalizedQuery.value)
  return visibleProjects.value.some(
    (project: any) => stripDiacritics(project.name.toLowerCase()) === stripped
  )
})

const showCreateOption = computed(() =>
  normalizedQuery.value.length > 0 && !hasExactLocalMatch.value
)

const tooltipWethodInfo = computed(() => {
  if (selection.value?.type !== 'local' || !selection.value.localProject.linkedProjectId) return null
  const wethodProject = wethodProjects.value.find((wp: any) => wp.id === selection.value.localProject.linkedProjectId)
  if (!wethodProject) return null
  const area = wethodProject.areas.find((area: any) => area.id === selection.value.localProject.linkedAreaId)
  return { projectName: wethodProject.name, areaName: area?.name || 'Generico' }
})

watch(() => props.modelValue, (newData) => {
  duration.value = newData.duration
  notes.value = newData.notes
  location.value = newData.location || 'home'

  if (newData.directWethodProjectId) {
    const wethodProject = wethodProjects.value.find((project: any) => project.id === newData.directWethodProjectId)
    const wethodArea = wethodProject?.areas.find((area: any) => area.id === newData.directWethodAreaId)
    selection.value = {
      type: 'wethod',
      wethodProjectId: newData.directWethodProjectId,
      wethodAreaId: newData.directWethodAreaId,
      wethodProjectName: wethodProject?.name || '?',
      wethodAreaName: wethodArea?.name || 'Generico'
    }
    editing.value = false
  } else if (newData.project) {
    const localProject = visibleProjects.value.find((project: any) => project.id === newData.project.id)
    if (localProject) {
      selection.value = { type: 'local', localProject, resolvedLabel: resolveProjectLabel(localProject) }
      editing.value = false
    }
  } else {
    selection.value = null
    editing.value = true
  }
}, { immediate: true, deep: true })

watch(searchQuery, () => { highlightedIndex.value = 0 })

function handleClickOutside(event: MouseEvent) {
  if (!(event.target as HTMLElement)?.isConnected) return
  if (!projectColumn.value?.contains(event.target as Node)) {
    dropdownOpen.value = false
    if (editing.value && selection.value) editing.value = false
  }
}

onMounted(() => { document.addEventListener('click', handleClickOutside) })
onBeforeUnmount(() => { document.removeEventListener('click', handleClickOutside) })

function stripDiacritics(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036F]/g, '')
}

function fuzzyMatch(text: string, query: string) {
  const normalizedText = stripDiacritics(text.toLowerCase())
  const normalizedQ = stripDiacritics(query.toLowerCase().trim())
  if (!normalizedQ) return true
  if (normalizedText.includes(normalizedQ)) return true
  const tokens = normalizedQ.split(/\s+/)
  if (tokens.length > 1 && tokens.every(token => normalizedText.includes(token))) return true
  const initials = normalizedText.split(/[\s\-_.']+/).map(word => word[0]).filter(Boolean).join('')
  if (initials.includes(normalizedQ)) return true
  return false
}

function resolveProjectLabel(project: any) {
  if (!project.linkedProjectId) return null
  const wethodProject = wethodProjects.value.find((wp: any) => wp.id === project.linkedProjectId)
  if (!wethodProject) return null
  const area = wethodProject.areas.find((area: any) => area.id === project.linkedAreaId)
  return `${wethodProject.name}${area ? ' / ' + (area.name || 'Generico') : ''}`
}

function flatIndexForLocal(localIndex: number) { return localIndex }

function openDropdown() { dropdownOpen.value = true }
function closeDropdown() { dropdownOpen.value = false }

function startEditing() {
  if (props.disabled) return
  searchQuery.value = ''
  editing.value = true
  highlightedIndex.value = 0
  nextTick(() => {
    searchInput.value?.focus()
    dropdownOpen.value = true
  })
}

function moveHighlight(delta: number) {
  if (!dropdownOpen.value) { dropdownOpen.value = true; return }
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

function selectHighlighted() {
  if (!dropdownOpen.value || totalSelectableCount.value === 0) {
    if (showCreateOption.value) createLocalProject()
    return
  }
  const index = highlightedIndex.value
  if (index < filteredLocalProjects.value.length) {
    selectLocalProject(filteredLocalProjects.value[index])
    return
  }
  if (showCreateOption.value && index === createOptionIndex.value) {
    createLocalProject()
    return
  }
  const wethodItem = filteredWethodEntries.value.find(
    (entry: any) => !entry.isHeader && entry.flatIndex === index
  )
  if (wethodItem) selectWethodArea(wethodItem.project, wethodItem.area)
}

function selectLocalProject(localProject: any) {
  selection.value = { type: 'local', localProject, resolvedLabel: resolveProjectLabel(localProject) }
  searchQuery.value = ''
  editing.value = false
  dropdownOpen.value = false
  if (localProject.defaultNotes && !notes.value) notes.value = localProject.defaultNotes
  emitUpdate()
  nextTick(() => durationRef.value?.focusInput?.())
}

function selectWethodArea(project: any, area: any) {
  selection.value = {
    type: 'wethod',
    wethodProjectId: project.id,
    wethodAreaId: area.id,
    wethodProjectName: project.name,
    wethodAreaName: area.name || 'Generico'
  }
  searchQuery.value = ''
  editing.value = false
  dropdownOpen.value = false
  emitUpdate()
  nextTick(() => durationRef.value?.focusInput?.())
}

async function createLocalProject() {
  const name = searchQuery.value.trim()
  if (!name) return
  const project = await projectsStore.add(name)
  selectLocalProject(project)
  router.push({ name: 'projects-id', params: { id: project.id } })
}

function escapeField() {
  if (presetsNavigating.value) { presetsNavigating.value = false; return }
  closeDropdown()
  if (editing.value && selection.value) editing.value = false
  ;(document.activeElement as HTMLElement)?.blur()
}

function focusProject() {
  if (selection.value && !editing.value) startEditing()
  else nextTick(() => searchInput.value?.focus())
}

function onDurationChange(value: number) {
  duration.value = value
  emitUpdate()
}

function onLocationChange(value: string) {
  location.value = value
  emitUpdate()
}

function emitUpdate() {
  if (!shouldEmitUpdate()) return

  const payload: Record<string, any> = {
    ...props.modelValue,
    duration: duration.value,
    notes: notes.value,
    location: location.value
  }

  if (selection.value?.type === 'local') {
    payload.project = selection.value.localProject
    delete payload.directWethodProjectId
    delete payload.directWethodAreaId
  } else if (selection.value?.type === 'wethod') {
    payload.project = null
    payload.directWethodProjectId = selection.value.wethodProjectId
    payload.directWethodAreaId = selection.value.wethodAreaId
  } else {
    payload.project = undefined
    delete payload.directWethodProjectId
    delete payload.directWethodAreaId
  }

  emit('update:modelValue', payload)
}

function shouldEmitUpdate() {
  if (props.modelValue.duration !== duration.value) return true
  if (props.modelValue.notes !== notes.value) return true
  if (props.modelValue.location !== location.value) return true

  const hadLocal = !!props.modelValue.project
  const hadWethod = !!props.modelValue.directWethodProjectId
  const hasLocal = selection.value?.type === 'local'
  const hasWethod = selection.value?.type === 'wethod'

  if (hadLocal !== hasLocal || hadWethod !== hasWethod) return true
  if (hasLocal && props.modelValue.project?.id !== selection.value.localProject.id) return true
  if (hasWethod && (
    props.modelValue.directWethodProjectId !== selection.value.wethodProjectId ||
    props.modelValue.directWethodAreaId !== selection.value.wethodAreaId
  )) return true

  return false
}

function handleSubmit() {
  if (selection.value?.type === 'local' && selection.value.localProject.requiresNotes && !notes.value) {
    notesInput.value?.focus()
    return
  }
  emit('userSubmit')
}

function handleNotesEnter(event: KeyboardEvent) {
  if (presetsNavigating.value) {
    event.preventDefault()
    if (highlightedPresetIndex.value >= visiblePresets.value.length) startQuickCreate()
    else selectPreset(visiblePresets.value[highlightedPresetIndex.value])
    return
  }
  handleSubmit()
}

function selectPreset(preset: any) {
  notes.value = preset.label
  presetsNavigating.value = false
  emitUpdate()
}

function enterPresetsSelector() {
  if (!showPresets.value) return
  presetsNavigating.value = true
  highlightedPresetIndex.value = 0
}

function onNotesInput() {
  notesFocused.value = true
  emitUpdate()
}

function handleNotesBlur() {
  setTimeout(() => {
    if (quickCreateActive.value) return
    notesFocused.value = false
    presetsNavigating.value = false
  }, 150)
}

function handleNotesKeydown(event: KeyboardEvent) {
  if (!presetsNavigating.value) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    const totalItems = visiblePresets.value.length + 1
    highlightedPresetIndex.value = (highlightedPresetIndex.value + 1) % totalItems
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    const totalItems = visiblePresets.value.length + 1
    highlightedPresetIndex.value = (highlightedPresetIndex.value - 1 + totalItems) % totalItems
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    presetsNavigating.value = false
  }
}

function startQuickCreate() {
  quickCreateActive.value = true
  quickCreateLabel.value = ''
  nextTick(() => quickCreateInput.value?.focus())
}

async function confirmQuickCreate() {
  const label = quickCreateLabel.value.trim()
  if (!label) { cancelQuickCreate(); return }
  await presetsStore.add(label)
  quickCreateActive.value = false
  quickCreateLabel.value = ''
  notesInput.value?.focus()
}

function cancelQuickCreate() {
  quickCreateActive.value = false
  quickCreateLabel.value = ''
}

defineExpose({ focusProject })
</script>

<style scoped>
.selection-tooltip {
  transition: opacity 0.15s ease;
  opacity: 0;
}
.group:hover .selection-tooltip {
  opacity: 1;
  transition-delay: 0.4s;
}
</style>
