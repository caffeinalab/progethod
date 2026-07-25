<template>
  <span class="text-xs font-bold uppercase px-2 py-1 rounded" :class="leaveStatusBadgeClass(status)">
    {{ leaveStatusLabel(status, t) }}
  </span>
</template>

<script setup lang="ts">
import { leaveStatusBadgeClass, leaveStatusLabel } from '~/utils/leaveStatus'

defineProps<{
  status: string
}>()

const { t } = useI18n()
</script>
