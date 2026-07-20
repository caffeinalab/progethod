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
        <ProgressBar :fill="sentPercentage" />
      </div>
    </div>
    <Alert v-if="isExpired" class="w-full" level="error" :message="$t('session_expired')" />
    <Alert v-if="isError" class="w-full" level="error" :message="errorMessage" />
    <div v-if="!isExpired && !isError && isConfirmOnSubmitRequired" class="flex items-center justify-center mt-4 sm:mt-6 w-full">
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
import { ref, computed, watch, nextTick } from 'vue'
import { IconSend } from '@tabler/icons-vue'
import pLimit from 'p-limit'

const { t: $t } = useI18n()
const api = useApi()
const userStore = useUserStore()
const entriesStore = useEntriesStore()
const preferencesStore = usePreferencesStore()
const eventBus = useEventBus()

const limit = pLimit(5)

const props = defineProps({
  modelValue: { type: Boolean, default: true },
  timesheetData: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const isSubmitting = ref(false)
const isError = ref(false)
const errorMessage = ref('')
const sentData = ref(0)

const isExpired = computed(() => userStore.isTokenExpired)
const isConfirmOnSubmitRequired = computed(() => preferencesStore.requireConfirmationOnSubmit)

const sentPercentage = computed(() => {
  const total = props.timesheetData?.length || 0
  return Math.floor((sentData.value * 100 / total) || 0)
})

watch(() => props.modelValue, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal === true && !isExpired.value && !isConfirmOnSubmitRequired.value) {
    nextTick(() => submit())
  }
})

async function submit() {
  isSubmitting.value = true
  sentData.value = 0
  isError.value = false

  try {
    await Promise.all(
      (props.timesheetData || []).map(
        (entry) => limit(async () => {
          const { internalIds, debugProjectName, ...requestData } = entry
          let data = {}

          try {
            data = await api.$post('timetracking', requestData)
          } catch (err) {
            data = {
              code: err.response?.status || 500,
              message: err.message,
            }
          }

          if (data.code !== 200) {
            isSubmitting.value = false
            isError.value = true
            errorMessage.value = $t('errors.unexpected_status_code', {
              code: data.code || '',
              message: data.message || '',
              project: debugProjectName,
            })
            throw new Error(errorMessage.value)
          }

          sentData.value++
          internalIds.forEach((id) => entriesStore.setSyncState({ id, synced: true }))
        }),
      ),
    )

    emit('update:modelValue', false)
    eventBus.emit('tracked-hours:refresh')
  } finally {
    isSubmitting.value = false
  }
}
</script>
