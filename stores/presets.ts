import { defineStore } from 'pinia'
import { useSoftDeletableCollection, type SoftDeletableItem } from './softDeletableStore'

export interface Preset extends SoftDeletableItem {
  label: string
}

export const usePresetsStore = defineStore('presets', () => {
  const {
    items: presets,
    updatedAt,
    visibleItems: visiblePresets,
    add: addItem,
    update,
    remove,
    restoreBackup,
    restoreFromServer,
  } = useSoftDeletableCollection<Preset>()

  function add(label: string): Preset {
    return addItem({ label })
  }

  function reorder(orderedIds: string[]) {
    const presetMap = new Map(presets.value.map(preset => [preset.id, preset]))
    const reordered = orderedIds.map(id => presetMap.get(id)).filter(Boolean) as Preset[]
    const remaining = presets.value.filter(preset => !orderedIds.includes(preset.id))
    presets.value = [...reordered, ...remaining]
    updatedAt.value = new Date().toISOString()
  }

  return {
    presets,
    updatedAt,
    visiblePresets,
    add,
    update,
    remove,
    reorder,
    restoreBackup,
    restoreFromServer,
  }
})
