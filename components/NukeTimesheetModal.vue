<template>
  <Modal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-danger-soft border border-danger/20">
      <IconAlertTriangle :size="24" class="text-danger" />
    </div>
    <p class="text-lg font-semibold mt-4 text-ink text-center">
      {{ $t('about_to_nuke_timesheet') }}
    </p>
    <p class="text-sm leading-relaxed mt-1.5 text-center text-ink-muted max-w-xs">
      {{ $t('nuke_timesheet_warning') }}
    </p>
    <div v-if="isSubmitting && !isExpired" class="w-full mt-4">
      <ProgressBar :fill="progressPercentage" />
    </div>
    <Alert v-if="isExpired" class="w-full mt-4" level="error" :message="$t('session_expired')" />
    <div v-if="!isExpired" class="flex items-center gap-3 mt-6 w-full">
      <button
        v-if="!isSubmitting"
        class="flex-1 px-4 py-2.5 rounded-lg border border-stroke bg-card text-sm font-medium text-ink hover:bg-card-hover transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"
        @click="emit('update:modelValue', false)"
      >
        {{ $t('calendar_page.cancel') }}
      </button>
      <button
        v-if="!isSubmitting"
        class="flex-1 px-4 py-2.5 rounded-lg bg-danger text-sm font-medium text-ink-inverse hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-danger"
        @click="submit()"
      >
        {{ $t('reset_day') }}
      </button>
      <button
        v-if="isSubmitting"
        class="flex-1 px-4 py-2.5 rounded-lg bg-card-hover border border-stroke text-sm text-ink-muted cursor-default"
        disabled
      >
        <span class="inline-flex items-center gap-2">
          <IconLoader :size="16" class="animate-spin" />
          {{ $t('please_wait_sending') }}
        </span>
      </button>
    </div>
  </Modal>
</template>

<script setup>
import { IconAlertTriangle, IconLoader } from '@tabler/icons-vue'
import { prepareForCleanup } from '~/utils/timesheetMapper'

const api = useApi()
const userStore = useUserStore()
const entriesStore = useEntriesStore()

const { isSubmitting, isExpired, progressPercentage, execute } = useTimesheetBatchPost()

const props = defineProps({
  modelValue: { type: Boolean, default: true },
  dayEntries: { type: Array, default: () => [] },
  day: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

async function submit() {
  const employeeId = userStore.info?.employee_id

  const response = await api.$get('timetrackingboard', { params: { date: props.day } })
  const editableProjects = (response.data || []).filter((entry) => entry.can_edit === true)
  const entriesToPost = prepareForCleanup(editableProjects, employeeId)

  const success = await execute(entriesToPost)

  if (success) {
    props.dayEntries.forEach(({ id }) => entriesStore.setSyncState({ id, synced: false }))
    emit('update:modelValue', false)
  }
}
</script>
