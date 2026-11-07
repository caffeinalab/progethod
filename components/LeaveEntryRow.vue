<template>
  <div class="entry-row col-span-full grid grid-cols-subgrid items-start" :title="$t('leave_row.locked_hint')">
    <div class="flex items-center justify-center w-full h-10">
      <component :is="leaveStatusIcon(status)" :size="16" :class="leaveStatusIconClass(status)" />
    </div>

    <div class="leave-cell flex items-center gap-2 pl-2 pr-3">
      <LeaveTypePill :project-id="entry.projectId" />
      <span class="text-sm font-medium text-ink truncate">{{ typeLabel }}</span>
    </div>

    <div class="leave-cell flex items-center justify-center w-16 text-sm font-semibold text-accent-fg">
      {{ formatDecimalHoursLabel(entry.hours) }}
    </div>

    <div class="leave-cell flex items-center gap-2 px-3 min-w-0">
      <RequestStatusBadge v-if="entry.isPending" :status="status" />
      <span class="text-sm text-ink-muted truncate">
        {{ entry.isPending ? $t('leave_row.pending_hint') : $t('leave_row.approved_hint') }}
      </span>
    </div>

    <div />

    <div class="flex justify-center items-center h-10">
      <NuxtLink
        to="/ferie"
        class="flex items-center justify-center min-w-6 min-h-6 rounded text-ink-faint hover:text-accent-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        :aria-label="$t('leave_row.manage')"
        :title="$t('leave_row.manage')"
      >
        <IconLock :size="16" :stroke-width="1.5" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconLock } from '@tabler/icons-vue'
import { formatDecimalHoursLabel } from '~/utils/duration'
import { VACATION_PROJECT_ID, leaveStatusIcon, leaveStatusIconClass } from '~/utils/leaveStatus'
import type { DayLeaveEntry } from '~/utils/plannings'

const props = defineProps<{ entry: DayLeaveEntry }>()

const { t: $t } = useI18n()

const status = computed(() => props.entry.isPending ? 'pending' : 'approved')
const typeLabel = computed(() => props.entry.projectId === VACATION_PROJECT_ID
  ? $t('calendar_page.vacation_label')
  : $t('calendar_page.leaves_label'))
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

.leave-cell {
  @apply h-10 rounded-lg border border-dashed border-accent/40 bg-accent-soft;
}
</style>
