<template>
  <div class="w-full bg-gray-200 py-10 pt-20">
    <div class="mx-auto container max-w-2xl bg-white shadow rounded p-6 lg:p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            {{ $t('pills.title') }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ $t('pills.description') }}
          </p>
        </div>
      </div>

      <!-- Add new pill -->
      <div class="flex gap-2 mb-6">
        <input
          ref="newPillInput"
          v-model="newPillLabel"
          type="text"
          class="flex-1 border border-gray-300 pl-3 py-2 shadow-sm bg-transparent rounded text-sm focus:outline-none focus:border-indigo-700 placeholder-gray-500 text-gray-600"
          :placeholder="$t('pills.new_placeholder')"
          @keyup.enter="addPill"
        >
        <button
          class="px-4 py-2 text-white bg-indigo-700 hover:bg-indigo-600 rounded transition duration-150 ease-in-out focus:outline-none disabled:bg-gray-400 disabled:cursor-default"
          :disabled="!newPillLabel.trim()"
          @click="addPill"
        >
          <plus-icon size="20" />
        </button>
      </div>

      <!-- Pills list (draggable) -->
      <div v-if="pills.length" class="space-y-2">
        <div
          v-for="(pill, index) in pills"
          :key="pill.id"
          draggable="true"
          class="flex items-center justify-between p-3 rounded border transition-colors cursor-grab active:cursor-grabbing"
          :class="dragOverIndex === index
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 hover:border-gray-300'"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent="onDragOver(index)"
          @dragleave="onDragLeave(index)"
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
        >
          <div v-if="editingId === pill.id" class="flex-1 flex gap-2">
            <input
              ref="editInput"
              v-model="editLabel"
              type="text"
              class="flex-1 border border-indigo-300 pl-3 py-1 rounded text-sm focus:outline-none focus:border-indigo-700 text-gray-600"
              @keyup.enter="saveEdit(pill.id)"
              @keyup.escape="cancelEdit"
            >
            <button
              class="px-3 py-1 text-sm text-white bg-indigo-700 hover:bg-indigo-600 rounded"
              @click="saveEdit(pill.id)"
            >
              {{ $t('save') }}
            </button>
            <button
              class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              @click="cancelEdit"
            >
              {{ $t('pills.cancel') }}
            </button>
          </div>
          <template v-else>
            <div class="flex items-center gap-2">
              <grip-vertical-icon size="16" class="text-gray-300 flex-shrink-0" />
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                {{ pill.label }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                :title="$t('edit')"
                @click="startEdit(pill)"
              >
                <edit-icon size="16" />
              </button>
              <button
                class="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                :title="$t('delete')"
                @click="removePill(pill.id)"
              >
                <trash-icon size="16" />
              </button>
            </div>
          </template>
        </div>
      </div>

      <p v-if="pills.length" class="text-xs text-gray-400 mt-3">
        {{ $t('pills.reorder_hint') }}
      </p>

      <!-- Empty state -->
      <div v-else class="text-center py-12 text-gray-400">
        <tag-icon size="48" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">
          {{ $t('pills.empty') }}
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
      newPillLabel: '',
      editingId: null,
      editLabel: '',
      dragIndex: null,
      dragOverIndex: null
    }
  },
  computed: {
    ...mapGetters({
      pills: 'pills/visiblePills'
    })
  },
  methods: {
    async addPill () {
      const label = this.newPillLabel.trim()
      if (!label) { return }
      await this.addPillAction(label)
      this.newPillLabel = ''
      this.$refs.newPillInput.focus()
    },
    startEdit (pill) {
      this.editingId = pill.id
      this.editLabel = pill.label
      this.$nextTick(() => {
        const input = this.$refs.editInput
        const element = Array.isArray(input) ? input[0] : input
        element?.focus()
      })
    },
    saveEdit (id) {
      const label = this.editLabel.trim()
      if (!label) { return }
      this.updatePill({ id, label })
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

      const reordered = [...this.pills]
      const [moved] = reordered.splice(this.dragIndex, 1)
      reordered.splice(targetIndex, 0, moved)

      this.reorderPills(reordered.map(pill => pill.id))
      this.dragOverIndex = null
      this.dragIndex = null
    },
    onDragEnd () {
      this.dragIndex = null
      this.dragOverIndex = null
    },
    ...mapActions({
      addPillAction: 'pills/add'
    }),
    ...mapMutations({
      updatePill: 'pills/update',
      removePill: 'pills/remove',
      reorderPills: 'pills/reorder'
    })
  }
}
</script>
