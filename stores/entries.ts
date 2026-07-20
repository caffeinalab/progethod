import { defineStore } from 'pinia'
import ShortUniqueId from 'short-unique-id'
import { durationRequiresAdjustment, getDecimalDuration } from '~/utils/duration'

const uid = new ShortUniqueId({ length: 10 })

interface EntryData {
  duration?: number
  decimal_duration?: number
  requires_adjustment?: boolean
  adjusted?: boolean
  location?: string
  notes?: string
  [key: string]: unknown
}

interface Entry {
  id: string
  day: string
  data: EntryData
  synced: boolean
}

function resetEntryDurations(data: EntryData): EntryData {
  data.decimal_duration = getDecimalDuration(data.duration)
  data.requires_adjustment = durationRequiresAdjustment(data.duration)
  data.adjusted = false
  return data
}

export const useEntriesStore = defineStore('entries', {
  state: () => ({
    entries: [] as Entry[],
  }),

  actions: {
    add({ day, data }: { day: string; data: EntryData }): Entry {
      const entry: Entry = {
        id: uid.rnd(),
        day,
        data: resetEntryDurations(data),
        synced: false,
      }
      this.entries.push(entry)
      return entry
    },
    update({ data, id }: { data: EntryData; id: string }) {
      const entry = this.entries.find(entry => entry.id === id)
      if (entry) { entry.data = resetEntryDurations(data) }
    },
    updateLocation({ location, id }: { location: string; id: string }) {
      const entry = this.entries.find(entry => entry.id === id)
      if (entry) { entry.data.location = location }
    },
    adjust({ adjustment, id }: { adjustment: number; id: string }) {
      const entry = this.entries.find(entry => entry.id === id)
      if (entry) {
        entry.data.decimal_duration = ((entry.data.decimal_duration || 0) * 10 + adjustment * 10) / 10
        entry.data.adjusted = true
      }
    },
    resetAdjustment(id: string) {
      const entry = this.entries.find(entry => entry.id === id)
      if (entry) { resetEntryDurations(entry.data) }
    },
    remove(id: string) {
      const index = this.entries.findIndex(entry => entry.id === id)
      if (index !== -1) { this.entries.splice(index, 1) }
    },
    restoreBackup(entries: Entry[]) {
      this.entries = entries
    },
    setSyncState({ id, synced }: { id: string; synced: boolean }) {
      const entry = this.entries.find(entry => entry.id === id)
      if (entry) { entry.synced = synced }
    },
  },
})
