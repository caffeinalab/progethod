import { ref, computed, nextTick, type Ref, type ComputedRef } from 'vue'

interface PresetPickerOptions {
  presets: ComputedRef<any[]>
  notesFocused: Ref<boolean>
  notesEmpty: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  quickCreateInputRef?: Ref<HTMLInputElement | null>
  notesInputRef?: Ref<HTMLInputElement | null>
}

export function usePresetPicker(options: PresetPickerOptions) {
  const { presets, notesFocused, notesEmpty, disabled, quickCreateInputRef, notesInputRef } = options

  const presetsStore = usePresetsStore()
  const presetsNavigating = ref(false)
  const highlightedPresetIndex = ref(0)
  const quickCreateActive = ref(false)
  const quickCreateLabel = ref('')

  const showPresets = computed(() =>
    notesFocused.value && notesEmpty.value && presets.value.length > 0 && !disabled.value,
  )

  function enterPresetsSelector() {
    if (!showPresets.value) return
    presetsNavigating.value = true
    highlightedPresetIndex.value = 0
  }

  function handleNotesKeydown(event: KeyboardEvent) {
    if (!presetsNavigating.value) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const totalItems = presets.value.length + 1
      highlightedPresetIndex.value = (highlightedPresetIndex.value + 1) % totalItems
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const totalItems = presets.value.length + 1
      highlightedPresetIndex.value = (highlightedPresetIndex.value - 1 + totalItems) % totalItems
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      presetsNavigating.value = false
    }
  }

  function startQuickCreate() {
    quickCreateActive.value = true
    quickCreateLabel.value = ''
    nextTick(() => quickCreateInputRef?.value?.focus())
  }

  async function confirmQuickCreate() {
    const label = quickCreateLabel.value.trim()
    if (!label) { cancelQuickCreate(); return }
    await presetsStore.add(label)
    quickCreateActive.value = false
    quickCreateLabel.value = ''
    notesInputRef?.value?.focus()
  }

  function cancelQuickCreate() {
    quickCreateActive.value = false
    quickCreateLabel.value = ''
  }

  function handleNotesBlur() {
    setTimeout(() => {
      if (quickCreateActive.value) return
      notesFocused.value = false
      presetsNavigating.value = false
    }, 150)
  }

  return {
    showPresets,
    presetsNavigating,
    highlightedPresetIndex,
    quickCreateActive,
    quickCreateLabel,
    enterPresetsSelector,
    handleNotesKeydown,
    startQuickCreate,
    confirmQuickCreate,
    cancelQuickCreate,
    handleNotesBlur,
  }
}
