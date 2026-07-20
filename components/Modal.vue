<template>
  <Teleport to="body">
    <div
      class="py-12 bg-black/40 transition-opacity z-50 fixed inset-0"
      :class="modelValue ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      @click.self="dismiss"
    >
      <div role="alert" class="container mx-auto w-11/12 md:w-2/3 max-w-xl flex justify-center" @click.self="dismiss">
        <div class="relative w-11/12 sm:w-8/12 md:w-9/12 bg-card shadow pt-10 pb-8 rounded-xl border border-stroke-muted">
          <div class="flex flex-col items-center px-4 md:px-8">
            <slot />
          </div>
          <button class="cursor-pointer absolute top-0 right-0 m-3 text-ink transition duration-150 ease-in-out" @click="dismiss">
            <IconX :size="20" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function dismiss() {
  emit('update:modelValue', false)
}
</script>

<style></style>
