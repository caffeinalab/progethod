<template>
  <div class="relative">
    <select
      v-model="model"
      class="w-full appearance-none pl-2.5 pr-8 py-1.5 border border-stroke-muted rounded-lg text-xs text-ink bg-card focus:ring-2 focus:ring-focus-ring focus:border-transparent outline-none"
    >
      <slot />
    </select>
    <IconChevronDown
      :size="14"
      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
import { IconChevronDown } from '@tabler/icons-vue'

const model = defineModel<string>({ required: true })
</script>
