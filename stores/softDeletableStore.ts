import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { v4 as uuid } from 'uuid'

export interface SoftDeletableItem {
  id: string
  deleted: boolean
  deletedAt: string | null
}

export interface SoftDeletableCollection<T extends SoftDeletableItem> {
  items: Ref<T[]>
  updatedAt: Ref<string | null>
  visibleItems: ComputedRef<T[]>
  add: (data: Omit<T, 'id' | 'deleted' | 'deletedAt'>) => T
  update: (partial: Partial<T> & { id: string }) => void
  remove: (id: string) => void
  restoreBackup: (restoredItems: T[]) => void
  restoreFromServer: (serverItems: T[], serverUpdatedAt?: string) => void
}

export function useSoftDeletableCollection<T extends SoftDeletableItem>(): SoftDeletableCollection<T> {
  const items = ref<T[]>([]) as Ref<T[]>
  const updatedAt = ref<string | null>(null)

  const visibleItems = computed(() => items.value.filter(item => item.deleted !== true))

  function add(data: Omit<T, 'id' | 'deleted' | 'deletedAt'>): T {
    const item = {
      ...data,
      id: uuid(),
      deleted: false,
      deletedAt: null,
    } as T
    items.value.push(item)
    updatedAt.value = new Date().toISOString()
    return item
  }

  function update(partial: Partial<T> & { id: string }) {
    const index = items.value.findIndex(item => item.id === partial.id)
    if (index !== -1) {
      Object.assign(items.value[index], partial)
      updatedAt.value = new Date().toISOString()
    }
  }

  function remove(id: string) {
    const item = items.value.find(existing => existing.id === id)
    if (!item) { return }
    items.value.splice(items.value.indexOf(item), 1)
    item.deleted = true
    item.deletedAt = new Date().toISOString()
    items.value.push(item)
    updatedAt.value = new Date().toISOString()
  }

  function restoreBackup(restoredItems: T[]) {
    items.value = restoredItems
    updatedAt.value = new Date().toISOString()
  }

  function restoreFromServer(serverItems: T[], serverUpdatedAt?: string) {
    items.value = serverItems
    updatedAt.value = serverUpdatedAt || new Date().toISOString()
  }

  return {
    items,
    updatedAt,
    visibleItems,
    add,
    update,
    remove,
    restoreBackup,
    restoreFromServer,
  }
}
