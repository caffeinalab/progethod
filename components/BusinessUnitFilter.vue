<template>
  <div class="relative inline-block">
    <button
      class="flex items-center text-sm font-bold text-gray-800 bg-white border border-gray-300 rounded px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      @click="isOpen = !isOpen"
    >
      <span>{{ $t('business_unit') }}</span>
      <span class="ml-1 text-gray-500 text-xs font-normal">({{ selectedCount }}/{{ allBusinessUnits.length }})</span>
      <chevron-down-icon
        width="16"
        height="16"
        class="ml-1 text-gray-400 transition-transform"
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
      class="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-30"
    >
      <label class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
        <input
          type="checkbox"
          :checked="allSelected"
          :indeterminate.prop="someSelected"
          class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          @change="toggleAll"
        >
        <span class="ml-2 text-sm font-medium text-gray-700">{{ $t('select_all') }}</span>
      </label>

      <div class="max-h-64 overflow-y-auto">
        <label
          v-for="businessUnit in allBusinessUnits"
          :key="String(businessUnit.id)"
          class="flex items-center px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="checkbox"
            :checked="isSelected(businessUnit.id)"
            class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            @change="toggle(businessUnit.id)"
          >
          <span class="ml-2 text-sm text-gray-700 truncate">{{ businessUnit.name }}</span>
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
