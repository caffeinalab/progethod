import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'

interface Preset {
  id: string
  label: string
  deleted: boolean
  deletedAt: string | null
}

export const usePresetsStore = defineStore('presets', {
  state: () => ({
    presets: [] as Preset[],
    updatedAt: null as string | null,
  }),

  getters: {
    visiblePresets: (state) => state.presets.filter(preset => preset.deleted !== true),
  },

  actions: {
    add(label: string): Preset {
      const preset: Preset = {
        label,
        id: uuid(),
        deleted: false,
        deletedAt: null,
      }
      this.presets.push(preset)
      this.updatedAt = new Date().toISOString()
      return preset
    },
    update(preset: Partial<Preset> & { id: string }) {
      const index = this.presets.findIndex(existing => existing.id === preset.id)
      if (index !== -1) {
        Object.assign(this.presets[index], preset)
        this.updatedAt = new Date().toISOString()
      }
    },
    reorder(orderedIds: string[]) {
      const presetMap = new Map(this.presets.map(preset => [preset.id, preset]))
      const reordered = orderedIds.map(id => presetMap.get(id)).filter(Boolean) as Preset[]
      const remaining = this.presets.filter(preset => !orderedIds.includes(preset.id))
      this.presets = [...reordered, ...remaining]
      this.updatedAt = new Date().toISOString()
    },
    remove(id: string) {
      const preset = this.presets.find(existing => existing.id === id)
      if (!preset) { return }
      this.presets.splice(this.presets.indexOf(preset), 1)
      preset.deleted = true
      preset.deletedAt = new Date().toISOString()
      this.presets.push(preset)
      this.updatedAt = new Date().toISOString()
    },
    restoreBackup(presets: Preset[]) {
      this.presets = presets
      this.updatedAt = new Date().toISOString()
    },
    restoreFromServer(presets: Preset[], updatedAt?: string) {
      this.presets = presets
      this.updatedAt = updatedAt || new Date().toISOString()
    },
  },
})
