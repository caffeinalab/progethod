<template>
  <Teleport to="body">
    <div
      v-show="modelValue"
      ref="overlayRef"
      data-modal-overlay
      tabindex="-1"
      class="py-12 bg-black/40 z-50 fixed inset-0 outline-none"
      role="dialog"
      aria-modal="true"
      @click.self="dismiss"
    >
      <div class="container mx-auto w-11/12 md:w-2/3 max-w-xl flex justify-center" @click.self="dismiss">
        <div class="relative w-11/12 sm:w-8/12 md:w-9/12 bg-card shadow pt-10 pb-8 rounded-xl border border-stroke-muted">
          <div class="flex flex-col items-center px-4 md:px-8">
            <slot />
          </div>
          <button type="button" class="cursor-pointer absolute top-0 right-0 m-3 text-ink transition duration-150 ease-in-out" @click="dismiss">
            <IconX :size="20" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { IconX } from '@tabler/icons-vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  /** Enable Enter to emit `confirm`. Escape always dismisses. */
  confirmable?: boolean
}>(), {
  confirmable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

const overlayRef = ref<HTMLElement | null>(null)

function dismiss() {
  emit('update:modelValue', false)
}

useModalKeyboard({
  isOpen: () => props.modelValue,
  onDismiss: dismiss,
  onConfirm: () => emit('confirm'),
  confirmEnabled: () => props.confirmable,
})

watch(() => props.modelValue, async (open) => {
  if (!open) { return }
  await nextTick()
  overlayRef.value?.focus({ preventScroll: true })
})
</script>
