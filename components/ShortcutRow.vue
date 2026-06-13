<template>
  <div class="flex items-center justify-between py-1">
    <span class="text-sm text-gray-600">{{ label }}</span>
    <span class="flex gap-1">
      <kbd
        v-for="(key, index) in keyParts"
        :key="index"
        class="inline-block px-2 py-0.5 text-xs font-mono font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm"
      >
        {{ key }}
      </kbd>
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
    keyParts () {
      return this.keys.split('+').map(part => part.trim())
    }
  }
}
</script>
