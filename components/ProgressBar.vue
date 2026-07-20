<template>
  <div>
    <div class="flex justify-between items-center pb-2 flex-col">
      <p class="text-xs text-accent-fg font-bold">
        {{ fill }}% {{ $t('sent') }}
      </p>
      <p class="text-xs font-bold text-ink">
        {{ $t('please_wait_sending') }}
      </p>
    </div>
    <div class="flex items-center">
      <div class="w-full bg-stroke-muted h-1 mr-1 rounded-tl rounded-bl relative">
        <div class="h-1 bg-accent transition-transform w-full origin-left" :style="{ transform: `scaleX(${fill / 100})` }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()

defineProps<{
  fill: number
}>()
</script>
