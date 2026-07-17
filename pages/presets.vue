<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container max-w-2xl bg-card shadow rounded-lg p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-ink">
            {{ $t('presets.title') }}
          </h1>
          <p class="text-sm text-ink-muted mt-1">
            {{ $t('presets.description') }}
          </p>
        </div>
      </div>

      <!-- Add new preset -->
      <div class="flex gap-2 mb-6">
        <input
          ref="newPresetInput"
          v-model="newPresetLabel"
          type="text"
          class="flex-1 border border-stroke pl-3 py-2 shadow-sm bg-transparent rounded-lg text-sm focus:outline-none focus:border-accent placeholder-ink-faint text-ink-secondary"
          :placeholder="$t('presets.new_placeholder')"
          @keyup.enter="addPreset"
        >
        <button
          class="flex items-center justify-center w-10 h-10 rounded-lg border shadow transition-colors duration-150 focus:outline-none"
          :class="newPresetLabel.trim()
            ? 'bg-accent border-accent text-ink-inverse hover:bg-accent-hover hover:border-accent-hover focus:ring-2 focus:ring-focus-ring focus:ring-offset-1'
            : 'bg-card-dim border-stroke-muted text-ink-disabled cursor-default'"
          :disabled="!newPresetLabel.trim()"
          @click="addPreset"
        >
          <plus-icon size="20" />
        </button>
      </div>

      <!-- Presets list (draggable) -->
      <div v-if="presets.length" class="space-y-2">
        <div
          v-for="(preset, index) in presets"
          :key="preset.id"
          draggable="true"
          class="flex items-center justify-between p-3 rounded-lg border transition-colors cursor-grab active:cursor-grabbing"
          :class="dragOverIndex === index
            ? 'border-accent bg-accent-soft'
            : 'border-stroke hover:border-ink-faint'"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent="onDragOver(index)"
          @dragleave="onDragLeave(index)"
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
        >
          <div v-if="editingId === preset.id" class="flex-1 flex gap-2">
            <input
              ref="editInput"
              v-model="editLabel"
              type="text"
              class="flex-1 border border-accent pl-3 py-1 rounded-lg text-sm focus:outline-none focus:border-accent-hover text-ink-secondary"
              @keyup.enter="saveEdit(preset.id)"
              @keyup.escape="cancelEdit"
            >
            <button
              class="px-3 py-1 text-sm text-ink-inverse bg-accent hover:bg-accent-hover rounded-lg"
              @click="saveEdit(preset.id)"
            >
              {{ $t('save') }}
            </button>
            <button
              class="px-3 py-1 text-sm text-ink-secondary hover:text-ink"
              @click="cancelEdit"
            >
              {{ $t('presets.cancel') }}
            </button>
          </div>
          <template v-else>
            <div class="flex items-center gap-2">
              <grip-vertical-icon size="16" class="text-ink-faint flex-shrink-0" />
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-ink-inverse">
                {{ preset.label }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="p-1.5 text-ink-faint hover:text-accent-fg rounded transition-colors"
                :title="$t('edit')"
                @click="startEdit(preset)"
              >
                <edit-icon size="16" />
              </button>
              <button
                class="p-1.5 text-ink-faint hover:text-danger rounded transition-colors"
                :title="$t('delete')"
                @click="removePreset(preset.id)"
              >
                <trash-icon size="16" />
              </button>
            </div>
          </template>
        </div>
      </div>

      <p v-if="presets.length" class="text-xs text-ink-faint mt-3">
        {{ $t('presets.reorder_hint') }}
      </p>

      <!-- Empty state -->
      <div v-else class="text-center py-12 text-ink-faint">
        <tag-icon size="48" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">
          {{ $t('presets.empty') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { PlusIcon, EditIcon, TrashIcon, TagIcon, GripVerticalIcon } from 'vue-tabler-icons'
import { mapGetters, mapActions, mapMutations } from 'vuex'

export default {
  components: {
    PlusIcon,
    EditIcon,
    TrashIcon,
    TagIcon,
    GripVerticalIcon
  },
  middleware: 'auth',
  data () {
    return {
      newPresetLabel: '',
      editingId: null,
      editLabel: '',
      dragIndex: null,
      dragOverIndex: null
    }
  },
  computed: {
    ...mapGetters({
      presets: 'presets/visiblePresets'
    })
  },
  methods: {
    async addPreset () {
      const label = this.newPresetLabel.trim()
      if (!label) { return }
      await this.addPresetAction(label)
      this.newPresetLabel = ''
      this.$refs.newPresetInput.focus()
    },
    startEdit (preset) {
      this.editingId = preset.id
      this.editLabel = preset.label
      this.$nextTick(() => {
        const input = this.$refs.editInput
        const element = Array.isArray(input) ? input[0] : input
        element?.focus()
      })
    },
    saveEdit (id) {
      const label = this.editLabel.trim()
      if (!label) { return }
      this.updatePreset({ id, label })
      this.editingId = null
    },
    cancelEdit () {
      this.editingId = null
    },
    onDragStart (index, event) {
      this.dragIndex = index
      event.dataTransfer.effectAllowed = 'move'
    },
    onDragOver (index) {
      if (index !== this.dragIndex) {
        this.dragOverIndex = index
      }
    },
    onDragLeave (index) {
      if (this.dragOverIndex === index) {
        this.dragOverIndex = null
      }
    },
    onDrop (targetIndex) {
      if (this.dragIndex === null || this.dragIndex === targetIndex) {
        this.dragOverIndex = null
        return
      }

      const reordered = [...this.presets]
      const [moved] = reordered.splice(this.dragIndex, 1)
      reordered.splice(targetIndex, 0, moved)

      this.reorderPresets(reordered.map(preset => preset.id))
      this.dragOverIndex = null
      this.dragIndex = null
    },
    onDragEnd () {
      this.dragIndex = null
      this.dragOverIndex = null
    },
    ...mapActions({
      addPresetAction: 'presets/add'
    }),
    ...mapMutations({
      updatePreset: 'presets/update',
      removePreset: 'presets/remove',
      reorderPresets: 'presets/reorder'
    })
  }
}
</script>
