<template>
  <Modal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <img src="https://i.ibb.co/QDMrqK5/Saly-10.png">
    <p class="text-base sm:text-lg md:text-2xl font-bold md:leading-6 mt-6 text-ink text-center">
      {{ $t('about_to_submit_timesheet') }}
    </p>
    <p class="text-xs sm:text-sm leading-5 mt-2 sm:mt-4 text-center text-ink-secondary">
      {{ $t('submit_timesheet_warning') }}
    </p>
    <div>
      <div class="w-full my-2 h-12 transition-opacity opacity-0" :class="{ 'opacity-100': isSubmitting && !isExpired }">
        <ProgressBar :fill="progressPercentage" />
      </div>
    </div>
    <Alert v-if="isExpired" class="w-full" level="error" :message="$t('session_expired')" />
    <Alert v-if="hasError" class="w-full" level="error" :message="errorMessage" />
    <div v-if="!isExpired && !hasError && isConfirmOnSubmitRequired" class="flex items-center justify-center mt-4 sm:mt-6 w-full">
      <button
        :disabled="isSubmitting"
        class="px-6 py-2 bg-accent disabled:bg-ink-muted text-ink-inverse disabled:text-ink-faint disabled:cursor-default focus:outline-none hover:bg-accent-hover mx-2 my-2 rounded-lg"
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
