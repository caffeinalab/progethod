<template>
  <div class="contents">
    <!-- Status icon -->
    <div class="warning-container w-8 h-8 flex justify-center items-center">
      <NuxtLink
        v-if="selection && selection.type === 'local'"
        :to="localeLocation({ name: 'projects-id', params: { id: selection.localProject.id } })"
      >
        <alert-triangle-icon v-if="!isSelectionLinked" class="text-yellow-500" />
        <external-link-icon v-if="isSelectionLinked" class="text-gray-400" />
      </NuxtLink>
      <check-icon v-else-if="selection && selection.type === 'wethod'" class="text-green-500" />
    </div>

    <!-- Unified project search -->
    <div class="w-full h-full relative" @keydown.escape="closeDropdown">
      <!-- Search input (visible when editing or nothing selected) -->
      <input
        v-if="editing"
        ref="searchInput"
        v-model="searchQuery"
        class="dark:text-gray-400 focus:outline-none focus:border focus:border-indigo-700 dark:focus:border-indigo-700 dark:border-gray-700 dark:bg-gray-800 bg-white font-normal w-full h-10 flex items-center pl-3 text-sm border-gray-300 rounded border shadow"
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
        class="w-full h-10 pl-3 pr-2 text-sm text-left border rounded shadow bg-white dark:bg-gray-800 flex items-center gap-1 transition-colors"
        :class="disabled
          ? 'border-gray-200 text-gray-300 cursor-default dark:border-gray-700'
          : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 cursor-text'"
        :disabled="disabled"
        @click="startEditing"
      >
        <span class="flex-1 min-w-0">
          <template v-if="selection.type === 'local'">
            <span class="flex items-center gap-1">
              <span class="font-medium flex-shrink-0">{{ selection.localProject.name }}</span>
              <span v-if="selection.resolvedLabel" class="text-gray-400 text-xs truncate">&rarr; {{ selection.resolvedLabel }}</span>
            </span>
          </template>
          <template v-else>
            <span class="block text-sm font-medium truncate leading-tight">{{ selection.wethodProjectName }}</span>
            <span class="block text-xs text-gray-400 truncate leading-tight">{{ selection.wethodAreaName }}</span>
          </template>
        </span>
      </button>

      <!-- Dropdown -->
      <div
        v-if="dropdownOpen && editing && !disabled"
        class="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-y-auto"
        style="min-width: 20rem"
      >
        <!-- Local projects -->
        <div v-if="filteredLocalProjects.length" class="p-1">
          <div class="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
            {{ $t('projects') }}
          </div>
          <button
            v-for="(localProject, localIndex) in filteredLocalProjects"
            :key="'local-' + localProject.id"
            :ref="'option-' + flatIndexForLocal(localIndex)"
            class="w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors"
            :class="highlightedIndex === flatIndexForLocal(localIndex) ? 'bg-indigo-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'"
            @click="selectLocalProject(localProject)"
            @mouseenter="highlightedIndex = flatIndexForLocal(localIndex)"
          >
            <span class="font-medium text-gray-800 dark:text-gray-200 truncate">{{ localProject.name }}</span>
            <alert-triangle-icon v-if="!localProject.linkedProjectId" class="text-yellow-400 flex-shrink-0" size="14" />
          </button>
        </div>

        <!-- Divider -->
        <div v-if="filteredLocalProjects.length && filteredWethodEntries.length" class="border-t border-gray-100 dark:border-gray-700 my-1" />

        <!-- Wethod projects + areas -->
        <div v-if="filteredWethodEntries.length" class="p-1">
          <div class="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Wethod
          </div>
          <template v-for="item in filteredWethodEntries">
            <!-- Project group header -->
            <div
              v-if="item.isHeader"
              :key="'wh-' + item.project.id"
              class="px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
            >
              {{ item.project.name }}
            </div>
            <!-- Area (selectable) -->
            <button
              v-else
              :key="'wha-' + item.project.id + '-' + item.area.id"
              :ref="'option-' + item.flatIndex"
              class="w-full text-left pl-7 pr-3 py-1.5 text-sm rounded flex items-center gap-2 transition-colors"
              :class="highlightedIndex === item.flatIndex ? 'bg-indigo-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'"
              @click="selectWethodArea(item.project, item.area)"
              @mouseenter="highlightedIndex = item.flatIndex"
            >
              <span class="text-gray-400">&bull;</span>
              <span class="text-gray-700 dark:text-gray-300">{{ item.area.name || 'Generico' }}</span>
            </button>
          </template>
        </div>

        <!-- Create new (when no exact local match) -->
        <div v-if="showCreateOption" class="border-t border-gray-100 dark:border-gray-700 p-1">
          <button
            :ref="'option-' + createOptionIndex"
            class="w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors"
            :class="highlightedIndex === createOptionIndex ? 'bg-indigo-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'"
            @click="createLocalProject"
            @mouseenter="highlightedIndex = createOptionIndex"
          >
            <plus-icon size="14" class="text-indigo-500" />
            <span class="text-indigo-600 dark:text-indigo-400">{{ $t('create_project_inline', { name: searchQuery.trim() }) }}</span>
          </button>
        </div>

        <!-- No results at all -->
        <div v-if="!filteredLocalProjects.length && !filteredWethodEntries.length && !showCreateOption" class="px-3 py-4 text-sm text-gray-400 text-center">
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
    <div class="w-full">
      <input
        ref="notes"
        v-model="notes"
        class="dark:text-gray-400 focus:outline-none focus:border focus:border-indigo-700 dark:focus:border-indigo-700 dark:border-gray-700 dark:bg-gray-800 bg-white font-normal w-full h-10 flex items-center pl-3 text-sm border-gray-300 rounded border shadow"
        :class="{ 'text-gray-300': disabled, 'text-gray-600': !disabled }"
        placeholder="Notes"
        :disabled="disabled"
        @input="hasUpdated"
        @keyup.enter="handleSubmit"
      >
    </div>

    <!-- Decimal -->
    <div>
      <span class="text-gray-600">
        {{ value.decimal_duration }}
      </span>
    </div>

    <!-- Adjustment icon -->
    <div class="flex justify-center items-center" :title="$t('requires_adjustment')">
      <adjustments-horizontal-icon v-if="value.requires_adjustment" class="text-gray-300" />
    </div>

    <!-- Location -->
    <div class="flex justify-center items-center" :title="$t('work_location')">
      <location-input v-model="location" :disabled="disabled" @input="hasUpdated" />
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { AlertTriangleIcon, ExternalLinkIcon, CheckIcon, AdjustmentsHorizontalIcon, PlusIcon } from 'vue-tabler-icons'
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
    AdjustmentsHorizontalIcon,
    PlusIcon
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
      selection: null
    }
  },
  computed: {
    ...mapGetters({
      visibleProjects: 'projects/visibleProjects',
      wethodProjects: 'apiData/projects'
    }),
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
    filteredWethodWithAreas () {
      const query = this.normalizedQuery
      if (!query) { return this.nonAutomaticWethodProjects.slice(0, 15) }
      return this.nonAutomaticWethodProjects.filter(
        project => fuzzyMatch(project.name, query)
      )
    },
    filteredWethodEntries () {
      const entries = []
      let flatIndex = this.filteredLocalProjects.length

      for (const project of this.filteredWethodWithAreas) {
        entries.push({ isHeader: true, project })
        for (const area of project.areas) {
          entries.push({ isHeader: false, project, area, flatIndex })
          flatIndex++
        }
      }
      return entries
    },
    totalSelectableCount () {
      const wethodAreaCount = this.filteredWethodEntries.filter(entry => !entry.isHeader).length
      return this.filteredLocalProjects.length + wethodAreaCount + (this.showCreateOption ? 1 : 0)
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
    createOptionIndex () {
      return this.totalSelectableCount - 1
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
    if (!this.value.project && !this.value.directWethodProjectId) {
      this.$nextTick(() => this.$refs.searchInput?.focus())
    }
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
    ...mapActions({
      addProject: 'projects/add'
    })
  }
}
</script>

<style>

</style>
