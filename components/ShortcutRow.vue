<template>
  <div class="flex items-center justify-between py-1">
    <span class="text-sm text-gray-600">{{ label }}</span>
    <span class="flex items-center gap-1">
      <template v-for="(group, groupIndex) in keyGroups">
        <span v-if="groupIndex > 0" :key="'sep-' + groupIndex" class="text-xs text-gray-400 mx-0.5">then</span>
        <kbd
          v-for="(key, keyIndex) in group"
          :key="groupIndex + '-' + keyIndex"
          class="inline-block px-2 py-0.5 text-xs font-mono font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm"
        >
          {{ key }}
        </kbd>
      </template>
    </span>
  </div>
</template>

<script>
export default {
  props: {
    keys: { type: String, required: true },
    label: { type: String, required: true }
  },
  computed: {
    keyGroups () {
      return this.keys.split('»').map(group =>
        group.split('+').map(part => part.trim()).filter(Boolean)
      )
    }
  }
}
</script>
