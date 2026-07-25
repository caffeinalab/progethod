<template>
  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" :class="leaveStatusBadgeClass(status)">
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
