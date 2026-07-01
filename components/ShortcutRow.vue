<template>
  <div class="flex items-center justify-between py-1">
    <span class="text-sm text-ink-secondary">{{ label }}</span>
    <span class="flex items-center gap-1">
      <template v-for="(group, groupIndex) in keyGroups">
        <span v-if="groupIndex > 0" :key="'sep-' + groupIndex" class="text-xs text-ink-faint mx-0.5">then</span>
        <kbd
          v-for="(key, keyIndex) in group"
          :key="groupIndex + '-' + keyIndex"
          class="inline-block px-2 py-0.5 text-xs font-mono font-semibold text-ink bg-card-dim border border-stroke rounded shadow-sm"
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
