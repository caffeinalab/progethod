<template>
  <Modal :model-value="modelValue" confirmable @update:model-value="emit('update:modelValue', $event)" @confirm="onConfirm">
    <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-accent-soft border border-accent/20">
      <IconSend :size="24" class="text-accent-fg" />
    </div>
    <p class="text-lg font-semibold mt-4 text-ink text-center">
      {{ $t('about_to_submit_timesheet') }}
    </p>
    <div class="mt-1.5 max-w-xs space-y-2 text-center">
      <p class="text-sm leading-relaxed text-ink-muted">
        {{ $t('submit_timesheet_warning') }}
      </p>
      <p class="text-sm leading-relaxed text-ink-muted">
        {{ $t('submit_timesheet_hint') }}
      </p>
    </div>
    <div v-if="isSubmitting && !isExpired" class="w-full mt-4">
      <ProgressBar :fill="progressPercentage" />
    </div>
    <Alert v-if="isExpired" class="w-full mt-4" level="error" :message="$t('session_expired')" />
    <Alert v-if="hasError" class="w-full mt-4" level="error" :message="errorMessage" />
    <div v-if="!isExpired && !hasError && isConfirmOnSubmitRequired" class="flex items-center justify-center mt-6 w-full">
      <button
        :disabled="isSubmitting"
        class="px-6 py-2.5 bg-accent disabled:bg-ink-muted text-ink-inverse disabled:text-ink-faint disabled:cursor-default focus:outline-none hover:bg-accent-hover rounded-lg"
        @click="submit()"
      >
        <IconSend :size="20" />
      </button>
    </div>
  </Modal>
</template>

<script setup>
import { watch, nextTick, computed } from 'vue'
import { IconSend } from '@tabler/icons-vue'

const { t: $t } = useI18n()
const entriesStore = useEntriesStore()
const preferencesStore = usePreferencesStore()

const { isSubmitting, isExpired, progressPercentage, hasError, errorMessage, execute } = useTimesheetBatchPost()

const props = defineProps({
  modelValue: { type: Boolean, default: true },
  timesheetData: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const isConfirmOnSubmitRequired = computed(() => preferencesStore.requireConfirmationOnSubmit)

watch(() => props.modelValue, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal === true && !isExpired.value && !isConfirmOnSubmitRequired.value) {
    nextTick(() => submit())
  }
})

function onConfirm() {
  if (isSubmitting.value || isExpired.value || hasError.value) { return }
  if (!isConfirmOnSubmitRequired.value) { return }
  submit()
}

async function submit() {
  const success = await execute(props.timesheetData || [], {
    onSuccess(_entry, internalIds) {
      internalIds.forEach((id) => entriesStore.setSyncState({ id, synced: true }))
    },
    formatError({ code, message, debugProjectName }) {
      return $t('errors.unexpected_status_code', {
        code: code || '',
        message: message || '',
        project: debugProjectName,
      })
    },
  })

  if (success) {
    emit('update:modelValue', false)
  }
}
</script>
