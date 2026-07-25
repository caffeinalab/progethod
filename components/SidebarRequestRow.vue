<template>
  <div class="sidebar-request-row group">
    <button type="button" class="sidebar-request-btn" @click="emit('navigate')">
      <span class="sidebar-primary">
        <span class="sidebar-date" :title="request.dateRange || undefined">{{ request.dateDayOnly }}</span>
        <span class="sidebar-hours">{{ request.totalHoursLabel }}</span>
      </span>
      <span class="sidebar-meta">
        <LeaveTypePill
          :project-id="request.projectId"
          :title="request.typeLabel"
          :short-label="request.typeShort"
        />
        <component
          :is="leaveStatusIcon(request.status)"
          :size="15"
          :class="leaveStatusIconClass(request.status)"
          :title="leaveStatusLabel(request.status, t)"
          class="shrink-0"
        />
      </span>
    </button>
    <div v-if="showActions" class="sidebar-actions">
      <button
        type="button"
        class="sidebar-action-btn hover:text-accent-fg"
        :title="t('edit')"
        @click="emit('edit')"
      >
        <IconEdit :size="16" />
      </button>
      <button
        type="button"
        class="sidebar-action-btn hover:text-danger"
        :title="t('delete')"
        @click="emit('delete')"
      >
        <IconTrash :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconEdit, IconTrash } from '@tabler/icons-vue'
import {
  leaveStatusIcon,
  leaveStatusIconClass,
  leaveStatusLabel,
} from '~/utils/leaveStatus'

defineProps<{
  request: {
    projectId: number
    typeLabel: string
    typeShort: string
    status: string
    dateDayOnly: string
    totalHoursLabel: string
    dateRange?: string
  }
  showActions?: boolean
}>()

const emit = defineEmits<{
  navigate: []
  edit: []
  delete: []
}>()

const { t } = useI18n()
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

.sidebar-request-row { @apply flex items-center rounded transition-colors px-2; gap: 0.375rem; min-height: 2.25rem; }
.sidebar-request-row:hover { @apply bg-card-hover; }
.sidebar-request-btn { @apply flex-1 min-w-0 flex items-center justify-between text-left cursor-pointer; gap: 0.5rem; }
.sidebar-primary { @apply flex items-baseline min-w-0; gap: 0.375rem; }
.sidebar-date { @apply text-sm font-semibold text-ink tabular-nums whitespace-nowrap capitalize; }
.sidebar-hours { @apply text-xs text-ink-muted whitespace-nowrap tabular-nums; }
.sidebar-meta { @apply flex items-center shrink-0; gap: 0.375rem; }
.sidebar-actions { @apply flex items-center shrink-0 opacity-0 transition-opacity; gap: 0.125rem; }
.sidebar-request-row:hover .sidebar-actions,
.sidebar-request-row:focus-within .sidebar-actions { @apply opacity-100; }
.sidebar-action-btn {
  @apply inline-flex items-center justify-center min-w-6 min-h-6 rounded text-ink-faint cursor-pointer transition-colors;
  @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring;
}
</style>
