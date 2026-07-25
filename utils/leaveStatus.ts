import { IconCircleCheck, IconCircleX, IconClock } from '@tabler/icons-vue'
import type { Component } from 'vue'

export type LeaveRequestStatus = 'approved' | 'pending' | 'rejected' | 'conflict' | string

export function leaveStatusIcon(status: LeaveRequestStatus): Component {
  if (status === 'approved') return IconCircleCheck
  if (status === 'pending') return IconClock
  return IconCircleX
}

export function leaveStatusIconClass(status: LeaveRequestStatus): string {
  if (status === 'approved') return 'text-vacation-text'
  if (status === 'pending') return 'text-pending-text'
  if (status === 'rejected' || status === 'conflict') return 'text-danger'
  return 'text-ink-muted'
}

export function leaveStatusBadgeClass(status: LeaveRequestStatus): string {
  if (status === 'pending') return 'bg-pending-soft text-pending-text'
  if (status === 'approved') return 'bg-vacation-soft text-vacation-text'
  return 'bg-card-hover text-ink-muted'
}

export function leaveStatusLabel(status: LeaveRequestStatus, translate: (key: string) => string): string {
  if (status === 'pending') return translate('calendar_page.pending')
  if (status === 'approved') return translate('calendar_page.approved')
  if (status === 'rejected') return translate('calendar_page.rejected')
  if (status === 'conflict') return translate('calendar_page.conflict')
  return status
}
