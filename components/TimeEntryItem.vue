<template>
  <div class="contents">
    <!-- Status icon column -->
    <div class="flex items-center justify-center w-full h-full">
      <template v-if="selection">
        <NuxtLink
          v-if="selection.type === 'local'"
          :to="localeLocation({ name: 'projects-id', params: { id: selection.localProject.id } })"
        >
          <alert-triangle-icon v-if="!isSelectionLinked" class="text-warning" size="16" />
          <external-link-icon v-if="isSelectionLinked" class="text-ink-faint" size="16" />
        </NuxtLink>
        <check-icon v-else-if="selection.type === 'wethod'" class="text-success" size="16" />
      </template>
    </div>

    <!-- Unified project search -->
    <div class="w-full h-full relative" @keydown.escape="escapeField">
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

        <chevron-down-icon v-if="!disabled" class="flex-shrink-0 text-ink-faint" size="16" />

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
            :ref="'option-' + flatIndexForLocal(localIndex)"
            class="w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors"
            :class="highlightedIndex === flatIndexForLocal(localIndex) ? 'bg-accent-soft' : 'hover:bg-card-hover'"
            @click="selectLocalProject(localProject)"
            @mouseenter="highlightedIndex = flatIndexForLocal(localIndex)"
          >
            <span class="font-medium text-ink truncate">{{ localProject.name }}</span>
            <alert-triangle-icon v-if="!localProject.linkedProjectId" class="text-warning flex-shrink-0" size="14" />
          </button>
        </div>

        <!-- Create new (when no exact local match) -->
        <div v-if="showCreateOption" class="p-1">
          <button
            :ref="'option-' + createOptionIndex"
            class="w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors"
            :class="highlightedIndex === createOptionIndex ? 'bg-accent-soft' : 'hover:bg-card-hover'"
            @click="createLocalProject"
            @mouseenter="highlightedIndex = createOptionIndex"
          >
            <plus-icon size="14" class="text-accent-fg" />
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
          <template v-for="item in filteredWethodEntries">
            <!-- Project group header -->
            <div
              v-if="item.isHeader"
              :key="'wh-' + item.project.id"
              class="px-3 py-1.5 text-sm font-medium text-ink-muted truncate"
            >
              {{ item.project.name }}
            </div>
            <!-- Area (selectable) -->
            <button
              v-else
              :key="'wha-' + item.project.id + '-' + item.area.id"
              :ref="'option-' + item.flatIndex"
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

        <!-- No results at all -->
        <div v-if="!filteredLocalProjects.length && !filteredWethodEntries.length && !showCreateOption" class="px-3 py-4 text-sm text-ink-faint text-center">
          {{ $t('select_project') }}
        </div>
      </div>
    </div>

    <!-- Duration -->
    <div>
      <duration-input
        ref="duration"
        v-model="duration"
        :disabled="disabled"
        @input="hasUpdated"
        @userSubmit="handleSubmit"
      />
    </div>

    <!-- Notes -->
    <div class="w-full relative">
      <input
        ref="notes"
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
        ref="presetsContainer"
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
      <location-input v-model="location" :disabled="disabled" @input="hasUpdated" />
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { AlertTriangleIcon, ExternalLinkIcon, CheckIcon, PlusIcon, ChevronDownIcon } from 'vue-tabler-icons'
import DurationInput from './DurationInput'
import LocationInput from './LocationInput'

function stripDiacritics (text) {
  return text.normalize('NFD').replace(/[\u0300-\u036F]/g, '')
}

function fuzzyMatch (text, query) {
  const normalizedText = stripDiacritics(text.toLowerCase())
  const normalizedQuery = stripDiacritics(query.toLowerCase().trim())
  if (!normalizedQuery) { return true }

  if (normalizedText.includes(normalizedQuery)) { return true }

  const tokens = normalizedQuery.split(/\s+/)
  if (tokens.length > 1 && tokens.every(token => normalizedText.includes(token))) {
    return true
  }

  const initials = normalizedText.split(/[\s\-_.']+/).map(word => word[0]).filter(Boolean).join('')
  if (initials.includes(normalizedQuery)) { return true }

  return false
}

export default {
  components: {
    DurationInput,
    LocationInput,
    AlertTriangleIcon,
    ExternalLinkIcon,
    CheckIcon,
    PlusIcon,
    ChevronDownIcon
  },
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      duration: 0,
      notes: '',
      location: 'home',
      searchQuery: '',
      editing: true,
      dropdownOpen: false,
      highlightedIndex: 0,
      selection: null,
      notesFocused: false,
      presetsNavigating: false,
      highlightedPresetIndex: 0,
      quickCreateActive: false,
      quickCreateLabel: ''
    }
  },
  computed: {
    ...mapGetters({
      visibleProjects: 'projects/visibleProjects',
      wethodProjects: 'apiData/projects',
      visiblePresets: 'presets/visiblePresets'
    }),
    showPresets () {
      return this.notesFocused && !this.notes && this.visiblePresets.length > 0 && !this.disabled
    },
    isSelectionLinked () {
      return this.selection?.type === 'local' && this.selection.localProject.linkedProjectId
    },
    normalizedQuery () {
      return this.searchQuery.toLowerCase().trim()
    },
    filteredLocalProjects () {
      if (!this.normalizedQuery) { return this.visibleProjects.slice(0, 10) }
      return this.visibleProjects.filter(
        project => fuzzyMatch(project.name, this.normalizedQuery)
      )
    },
    nonAutomaticWethodProjects () {
      return this.wethodProjects.filter(project => !project.isAutomatic)
    },
    createOptionIndex () {
      return this.filteredLocalProjects.length
    },
    wethodFlatIndexStart () {
      return this.filteredLocalProjects.length + (this.showCreateOption ? 1 : 0)
    },
    filteredWethodEntries () {
      const entries = []
      let flatIndex = this.wethodFlatIndexStart
      const query = this.normalizedQuery
      const projects = query ? this.nonAutomaticWethodProjects : this.nonAutomaticWethodProjects.slice(0, 15)

      for (const project of projects) {
        const projectNameMatches = fuzzyMatch(project.name, query)

        let areasToShow
        if (!query || projectNameMatches) {
          areasToShow = project.areas
        } else {
          areasToShow = project.areas.filter((area) => {
            const combinedText = project.name + ' ' + (area.name || '')
            return fuzzyMatch(combinedText, query)
          })
        }

        if (areasToShow.length === 0) { continue }

        entries.push({ isHeader: true, project })
        for (const area of areasToShow) {
          entries.push({ isHeader: false, project, area, flatIndex })
          flatIndex++
        }
      }

      return entries
    },
    totalSelectableCount () {
      const wethodAreaCount = this.filteredWethodEntries.filter(entry => !entry.isHeader).length
      return this.filteredLocalProjects.length + (this.showCreateOption ? 1 : 0) + wethodAreaCount
    },
    hasExactLocalMatch () {
      if (!this.normalizedQuery) { return false }
      const stripped = stripDiacritics(this.normalizedQuery)
      return this.visibleProjects.some(
        project => stripDiacritics(project.name.toLowerCase()) === stripped
      )
    },
    showCreateOption () {
      return this.normalizedQuery.length > 0 && !this.hasExactLocalMatch
    },
    tooltipWethodInfo () {
      if (this.selection?.type !== 'local' || !this.selection.localProject.linkedProjectId) {
        return null
      }
      const wethodProject = this.wethodProjects.find(wp => wp.id === this.selection.localProject.linkedProjectId)
      if (!wethodProject) { return null }
      const area = wethodProject.areas.find(a => a.id === this.selection.localProject.linkedAreaId)
      return {
        projectName: wethodProject.name,
        areaName: area?.name || 'Generico'
      }
    }
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler (newData) {
        this.duration = newData.duration
        this.notes = newData.notes
        this.location = newData.location || 'home'

        if (newData.directWethodProjectId) {
          const wethodProject = this.wethodProjects.find(project => project.id === newData.directWethodProjectId)
          const wethodArea = wethodProject?.areas.find(area => area.id === newData.directWethodAreaId)
          this.selection = {
            type: 'wethod',
            wethodProjectId: newData.directWethodProjectId,
            wethodAreaId: newData.directWethodAreaId,
            wethodProjectName: wethodProject?.name || '?',
            wethodAreaName: wethodArea?.name || 'Generico'
          }
          this.editing = false
        } else if (newData.project) {
          const localProject = this.visibleProjects.find(project => project.id === newData.project.id)
          if (localProject) {
            this.selection = {
              type: 'local',
              localProject,
              resolvedLabel: this.resolveProjectLabel(localProject)
            }
            this.editing = false
          }
        } else {
          this.selection = null
          this.editing = true
        }
      }
    },
    searchQuery () {
      this.highlightedIndex = 0
    }
  },
  mounted () {
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy () {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    resolveProjectLabel (project) {
      if (!project.linkedProjectId) { return null }
      const wethodProject = this.wethodProjects.find(wp => wp.id === project.linkedProjectId)
      if (!wethodProject) { return null }
      const area = wethodProject.areas.find(area => area.id === project.linkedAreaId)
      return `${wethodProject.name}${area ? ' / ' + (area.name || 'Generico') : ''}`
    },
    flatIndexForLocal (localIndex) {
      return localIndex
    },
    openDropdown () {
      this.dropdownOpen = true
    },
    closeDropdown () {
      this.dropdownOpen = false
    },
    startEditing () {
      if (this.disabled) { return }
      this.searchQuery = ''
      this.editing = true
      this.highlightedIndex = 0
      this.$nextTick(() => {
        this.$refs.searchInput?.focus()
        this.dropdownOpen = true
      })
    },
    moveHighlight (delta) {
      if (!this.dropdownOpen) {
        this.dropdownOpen = true
        return
      }
      const total = this.totalSelectableCount
      if (total === 0) { return }
      this.highlightedIndex = (this.highlightedIndex + delta + total) % total
      this.scrollHighlightedIntoView()
    },
    scrollHighlightedIntoView () {
      this.$nextTick(() => {
        const refArray = this.$refs['option-' + this.highlightedIndex]
        const element = Array.isArray(refArray) ? refArray[0] : refArray
        element?.$el?.scrollIntoView?.({ block: 'nearest' }) ||
          element?.scrollIntoView?.({ block: 'nearest' })
      })
    },
    selectHighlighted () {
      if (!this.dropdownOpen || this.totalSelectableCount === 0) {
        if (this.showCreateOption) {
          this.createLocalProject()
        }
        return
      }

      const index = this.highlightedIndex

      if (index < this.filteredLocalProjects.length) {
        this.selectLocalProject(this.filteredLocalProjects[index])
        return
      }

      if (this.showCreateOption && index === this.createOptionIndex) {
        this.createLocalProject()
        return
      }

      const wethodItem = this.filteredWethodEntries.find(
        entry => !entry.isHeader && entry.flatIndex === index
      )
      if (wethodItem) {
        this.selectWethodArea(wethodItem.project, wethodItem.area)
      }
    },
    selectLocalProject (localProject) {
      this.selection = {
        type: 'local',
        localProject,
        resolvedLabel: this.resolveProjectLabel(localProject)
      }
      this.searchQuery = ''
      this.editing = false
      this.dropdownOpen = false

      if (localProject.defaultNotes && !this.notes) {
        this.notes = localProject.defaultNotes
      }

      this.hasUpdated()
      this.$nextTick(() => this.$refs.duration?.$refs.input?.focus())
    },
    selectWethodArea (project, area) {
      this.selection = {
        type: 'wethod',
        wethodProjectId: project.id,
        wethodAreaId: area.id,
        wethodProjectName: project.name,
        wethodAreaName: area.name || 'Generico'
      }
      this.searchQuery = ''
      this.editing = false
      this.dropdownOpen = false

      this.hasUpdated()
      this.$nextTick(() => this.$refs.duration?.$refs.input?.focus())
    },
    async createLocalProject () {
      const name = this.searchQuery.trim()
      if (!name) { return }

      const project = await this.addProject(name)
      this.selectLocalProject(project)
      this.$router.push(this.localeLocation({ name: 'projects-id', params: { id: project.id } }))
    },
    escapeField () {
      if (this.presetsNavigating) {
        this.presetsNavigating = false
        return
      }
      this.closeDropdown()
      if (this.editing && this.selection) {
        this.editing = false
      }
      document.activeElement?.blur()
    },
    focusProject () {
      if (this.selection && !this.editing) {
        this.startEditing()
      } else {
        this.$nextTick(() => this.$refs.searchInput?.focus())
      }
    },
    handleClickOutside (event) {
      if (!event.target.isConnected) { return }
      if (!this.$el.contains(event.target)) {
        this.dropdownOpen = false
        if (this.editing && this.selection) {
          this.editing = false
        }
      }
    },
    hasUpdated () {
      if (!this.shouldEmitUpdate()) {
        return false
      }

      const payload = {
        ...this.value,
        duration: this.duration,
        notes: this.notes,
        location: this.location
      }

      if (this.selection?.type === 'local') {
        payload.project = this.selection.localProject
        delete payload.directWethodProjectId
        delete payload.directWethodAreaId
      } else if (this.selection?.type === 'wethod') {
        payload.project = null
        payload.directWethodProjectId = this.selection.wethodProjectId
        payload.directWethodAreaId = this.selection.wethodAreaId
      } else {
        payload.project = undefined
        delete payload.directWethodProjectId
        delete payload.directWethodAreaId
      }

      this.$emit('input', payload)
      return true
    },
    shouldEmitUpdate () {
      if (this.value.duration !== this.duration) { return true }
      if (this.value.notes !== this.notes) { return true }
      if (this.value.location !== this.location) { return true }

      const hadLocal = !!this.value.project
      const hadWethod = !!this.value.directWethodProjectId
      const hasLocal = this.selection?.type === 'local'
      const hasWethod = this.selection?.type === 'wethod'

      if (hadLocal !== hasLocal || hadWethod !== hasWethod) { return true }
      if (hasLocal && this.value.project?.id !== this.selection.localProject.id) { return true }
      if (hasWethod && (
        this.value.directWethodProjectId !== this.selection.wethodProjectId ||
        this.value.directWethodAreaId !== this.selection.wethodAreaId
      )) { return true }

      return false
    },
    handleSubmit (event) {
      if (this.selection?.type === 'local' && this.selection.localProject.requiresNotes && !this.notes) {
        this.$refs.notes.focus()
        return
      }
      this.$emit('userSubmit', event)
    },
    handleNotesEnter (event) {
      if (this.presetsNavigating) {
        event.preventDefault()
        if (this.highlightedPresetIndex >= this.visiblePresets.length) {
          this.startQuickCreate()
        } else {
          this.selectPreset(this.visiblePresets[this.highlightedPresetIndex])
        }
        return
      }
      this.handleSubmit(event)
    },
    selectPreset (preset) {
      this.notes = preset.label
      this.presetsNavigating = false
      this.hasUpdated()
    },
    enterPresetsSelector () {
      if (!this.showPresets) { return }
      this.presetsNavigating = true
      this.highlightedPresetIndex = 0
    },
    onNotesInput () {
      this.notesFocused = true
      this.hasUpdated()
    },
    handleNotesBlur () {
      setTimeout(() => {
        if (this.quickCreateActive) { return }
        this.notesFocused = false
        this.presetsNavigating = false
      }, 150)
    },
    handleNotesKeydown (event) {
      if (!this.presetsNavigating) { return }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        const totalItems = this.visiblePresets.length + 1
        this.highlightedPresetIndex = (this.highlightedPresetIndex + 1) % totalItems
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const totalItems = this.visiblePresets.length + 1
        this.highlightedPresetIndex = (this.highlightedPresetIndex - 1 + totalItems) % totalItems
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        this.presetsNavigating = false
      }
    },
    startQuickCreate () {
      this.quickCreateActive = true
      this.quickCreateLabel = ''
      this.$nextTick(() => this.$refs.quickCreateInput?.focus())
    },
    async confirmQuickCreate () {
      const label = this.quickCreateLabel.trim()
      if (!label) {
        this.cancelQuickCreate()
        return
      }
      await this.addPreset(label)
      this.quickCreateActive = false
      this.quickCreateLabel = ''
      this.$refs.notes?.focus()
    },
    cancelQuickCreate () {
      this.quickCreateActive = false
      this.quickCreateLabel = ''
    },
    ...mapActions({
      addProject: 'projects/add',
      addPreset: 'presets/add'
    })
  }
}
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
