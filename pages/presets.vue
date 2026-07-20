<template>
  <div class="w-full bg-page py-10 pt-20">
    <div class="mx-auto container max-w-2xl bg-card shadow rounded-lg p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-ink">{{ $t('presets.title') }}</h1>
          <p class="text-sm text-ink-muted mt-1">{{ $t('presets.description') }}</p>
        </div>
      </div>

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
          <IconPlus :size="20" />
        </button>
      </div>

      <div v-if="presetsStore.visiblePresets.length" class="space-y-2">
        <div
          v-for="(preset, index) in presetsStore.visiblePresets"
          :key="preset.id"
          draggable="true"
          class="preset-card flex items-center justify-between p-3 rounded-lg border transition-colors cursor-grab active:cursor-grabbing"
          :class="dragOverIndex === index ? 'border-accent bg-accent-soft' : 'border-stroke hover:border-ink-faint'"
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
            <button class="px-3 py-1 text-sm text-ink-inverse bg-accent hover:bg-accent-hover rounded-lg" @click="saveEdit(preset.id)">{{ $t('save') }}</button>
            <button class="px-3 py-1 text-sm text-ink-secondary hover:text-ink" @click="cancelEdit">{{ $t('presets.cancel') }}</button>
          </div>
          <template v-else>
            <div class="flex items-center gap-2">
              <IconGripVertical :size="16" class="text-ink-faint flex-shrink-0" />
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-ink-inverse">{{ preset.label }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button class="p-1.5 text-ink-faint hover:text-accent-fg rounded transition-colors" :title="$t('edit')" @click="startEdit(preset)">
                <IconEdit :size="16" />
              </button>
              <button class="p-1.5 text-ink-faint hover:text-danger rounded transition-colors" :title="$t('delete')" @click="presetsStore.remove(preset.id)">
                <IconTrash :size="16" />
              </button>
            </div>
          </template>
        </div>
      </div>

      <p v-if="presetsStore.visiblePresets.length" class="text-xs text-ink-faint mt-3">{{ $t('presets.reorder_hint') }}</p>

      <div v-else class="text-center py-12 text-ink-faint">
        <IconTag :size="48" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ $t('presets.empty') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconEdit, IconTrash, IconTag, IconGripVertical } from '@tabler/icons-vue'

definePageMeta({ middleware: 'auth' })

const presetsStore = usePresetsStore()

const newPresetLabel = ref('')
const newPresetInput = ref<HTMLInputElement | null>(null)
const editingId = ref<string | null>(null)
const editLabel = ref('')
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const editInput = ref<HTMLInputElement | null>(null)

function addPreset() {
  const label = newPresetLabel.value.trim()
  if (!label) { return }
  presetsStore.add(label)
  newPresetLabel.value = ''
  newPresetInput.value?.focus()
}

function startEdit(preset: { id: string; label: string }) {
  editingId.value = preset.id
  editLabel.value = preset.label
  nextTick(() => {
    const element = Array.isArray(editInput.value) ? editInput.value[0] : editInput.value
    element?.focus()
  })
}

function saveEdit(id: string) {
  const label = editLabel.value.trim()
  if (!label) { return }
  presetsStore.update({ id, label })
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index
  event.dataTransfer!.effectAllowed = 'move'
}

function onDragOver(index: number) {
  if (index !== dragIndex.value) { dragOverIndex.value = index }
}

function onDragLeave(index: number) {
  if (dragOverIndex.value === index) { dragOverIndex.value = null }
}

function onDrop(targetIndex: number) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) {
    dragOverIndex.value = null
    return
  }
  const reordered = [...presetsStore.visiblePresets]
  const [moved] = reordered.splice(dragIndex.value, 1)
  reordered.splice(targetIndex, 0, moved)
  presetsStore.reorder(reordered.map(preset => preset.id))
  dragOverIndex.value = null
  dragIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>
