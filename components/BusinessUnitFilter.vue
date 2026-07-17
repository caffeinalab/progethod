<template>
  <div class="relative inline-block">
    <button
      class="flex items-center text-sm font-bold text-ink bg-card border border-stroke-muted rounded-lg shadow px-3 py-2 hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-focus-ring transition-colors"
      @click="isOpen = !isOpen"
    >
      <span>{{ $t('business_unit') }}</span>
      <span class="ml-1 text-ink-muted text-xs font-normal">({{ selectedCount }}/{{ allBusinessUnits.length }})</span>
      <chevron-down-icon
        width="16"
        height="16"
        class="ml-1 text-ink-faint transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <div
      v-if="isOpen"
      class="fixed inset-0 z-20"
      @click="isOpen = false"
    />

    <div
      v-if="isOpen"
      class="absolute right-0 mt-1 w-72 bg-card border border-stroke-muted rounded-lg shadow-lg z-30"
    >
      <div class="p-1.5 border-b border-stroke-muted">
        <label class="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-card-hover cursor-pointer transition-colors">
          <span
            class="flex items-center justify-center w-4 h-4 rounded border transition-colors flex-shrink-0"
            :class="allSelected || someSelected ? 'bg-accent border-accent' : 'border-stroke bg-card'"
          >
            <svg v-if="allSelected" class="w-3 h-3 text-ink-inverse" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 6 5 8.5 9.5 3.5" /></svg>
            <svg v-else-if="someSelected" class="w-3 h-3 text-ink-inverse" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="9" y2="6" /></svg>
          </span>
          <input type="checkbox" class="sr-only" :checked="allSelected" :indeterminate.prop="someSelected" @change="toggleAll">
          <span class="text-sm font-medium text-ink">{{ $t('select_all') }}</span>
        </label>
      </div>

      <div class="max-h-64 overflow-y-auto p-1.5">
        <label
          v-for="businessUnit in allBusinessUnits"
          :key="String(businessUnit.id)"
          class="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-card-hover cursor-pointer transition-colors"
        >
          <span
            class="flex items-center justify-center w-4 h-4 rounded border transition-colors flex-shrink-0"
            :class="isSelected(businessUnit.id) ? 'bg-accent border-accent' : 'border-stroke bg-card'"
          >
            <svg v-if="isSelected(businessUnit.id)" class="w-3 h-3 text-ink-inverse" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 6 5 8.5 9.5 3.5" /></svg>
          </span>
          <input type="checkbox" class="sr-only" :checked="isSelected(businessUnit.id)" @change="toggle(businessUnit.id)">
          <span class="text-sm text-ink truncate">{{ businessUnit.name }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronDownIcon } from 'vue-tabler-icons'
import { mapGetters, mapMutations } from 'vuex'
import { updateApiData } from '~/utils/updateApiData'

export default {
  components: {
    ChevronDownIcon
  },
  data () {
    return {
      isOpen: false
    }
  },
  computed: {
    ...mapGetters({
      allBusinessUnits: 'user/businessUnits',
      selectedBusinessUnitIds: 'preferences/selectedBusinessUnitIds'
    }),
    allBuIds () {
      return this.allBusinessUnits.map(businessUnit => businessUnit.id)
    },
    effectiveSelection () {
      if (this.selectedBusinessUnitIds === null) {
        return this.allBuIds
      }
      return this.selectedBusinessUnitIds
    },
    selectedCount () {
      return this.effectiveSelection.length
    },
    allSelected () {
      return this.selectedCount === this.allBusinessUnits.length
    },
    someSelected () {
      return this.selectedCount > 0 && !this.allSelected
    }
  },
  methods: {
    ...mapMutations({
      setSelectedBusinessUnitIds: 'preferences/setSelectedBusinessUnitIds'
    }),
    isSelected (buId) {
      return this.effectiveSelection.includes(buId)
    },
    toggle (buId) {
      const current = [...this.effectiveSelection]
      const index = current.indexOf(buId)
      if (index >= 0) {
        current.splice(index, 1)
      } else {
        current.push(buId)
      }
      this.applySelection(current)
    },
    toggleAll () {
      if (this.allSelected) {
        this.applySelection([])
      } else {
        this.applySelection(null)
      }
    },
    applySelection (ids) {
      if (ids !== null && ids.length === this.allBusinessUnits.length) {
        ids = null
      }
      this.setSelectedBusinessUnitIds(ids)
      updateApiData(this.$axios, this.$store)
    }
  }
}
</script>
