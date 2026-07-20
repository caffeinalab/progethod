<template>
  <div>
    <input
      ref="inputEl"
      v-model="inputString"
      class="text-ink focus:outline-none focus:border focus:border-accent bg-card font-normal w-16 h-10 flex items-center pl-3 text-sm border-stroke rounded-lg border shadow"
      :class="{ 'text-ink-disabled': disabled, 'text-ink-secondary': !disabled }"
      type="text"
      maxlength="5"
      placeholder="00:00"
      :disabled="disabled"
      @input="handleUserInput"
      @blur="onBlur"
      @keydown.enter="enterKey"
      @keydown.escape="inputEl?.blur()"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { minutesToHHmm } from '~/utils/duration'

const props = defineProps<{
  modelValue: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'userSubmit': []
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const inputString = ref('')
const internalDuration = ref(0)

watch(() => props.modelValue, (newVal) => {
  if (internalDuration.value !== newVal) {
    internalDuration.value = newVal
    onBlur()
  }
}, { immediate: true })

function parseUserInput() {
  if (inputString.value.length >= 3) {
    const matches = inputString.value.match(/([0-9]{1,2}):?([0-5][0-9])/)
    if (!matches || matches.length !== 3) {
      internalDuration.value = 0
      return
    }
    const hours = parseInt(matches[1])
    const minutes = parseInt(matches[2])
    internalDuration.value = hours * 60 + minutes
    return
  }

  const parsed = parseInt(inputString.value)
  if (isNaN(parsed)) {
    internalDuration.value = 0
    return
  }

  if (parsed < 10) {
    internalDuration.value = parsed * 60
    return
  }

  internalDuration.value = Math.ceil(parsed / 15) * 15
}

function handleUserInput() {
  parseUserInput()
  emit('update:modelValue', internalDuration.value)
}

function onBlur() {
  if (!internalDuration.value) {
    inputString.value = ''
    return
  }
  inputString.value = minutesToHHmm(internalDuration.value)
}

function enterKey() {
  if (inputString.value) {
    emit('userSubmit')
  }
}

function focusInput() {
  inputEl.value?.focus()
}

defineExpose({ focusInput })
</script>
