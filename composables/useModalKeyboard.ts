import {
  ref,
  computed,
  watch,
  onBeforeUnmount,
  toValue,
  type MaybeRefOrGetter,
} from 'vue'

const openModalCount = ref(0)

/** True while any modal using useModalKeyboard is open. */
export function useHasOpenModal() {
  return computed(() => openModalCount.value > 0)
}

export interface UseModalKeyboardOptions {
  isOpen: MaybeRefOrGetter<boolean>
  onDismiss: () => void
  /** Primary action (send/confirm). Omit for informational / picker modals. */
  onConfirm?: () => void
  /** When false, Enter is ignored even if onConfirm is set. Default true. */
  confirmEnabled?: MaybeRefOrGetter<boolean>
}

/**
 * Shared modal keyboard behaviour:
 * - Escape always dismisses
 * - Enter triggers onConfirm when safe (not in textarea, not on a focused button, no modifiers)
 * Tracks open modals so global shortcuts can yield.
 *
 * Uses capture-phase window listeners so keys work even when focus remains
 * on the element that opened the modal.
 */
export function useModalKeyboard(options: UseModalKeyboardOptions) {
  let listening = false

  function handleKeydown(event: KeyboardEvent) {
    if (!toValue(options.isOpen)) { return }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      options.onDismiss()
      return
    }

    if (event.key !== 'Enter') { return }
    if (!options.onConfirm) { return }
    if (toValue(options.confirmEnabled ?? true) === false) { return }
    if (shouldSkipConfirm(event)) { return }

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    options.onConfirm()
  }

  function startListening() {
    if (listening || !import.meta.client) { return }
    listening = true
    openModalCount.value++
    // window + capture: runs before document bubble shortcuts and works
    // even when focus is still on the trigger behind the overlay.
    window.addEventListener('keydown', handleKeydown, true)
  }

  function stopListening() {
    if (!listening) { return }
    listening = false
    openModalCount.value = Math.max(0, openModalCount.value - 1)
    window.removeEventListener('keydown', handleKeydown, true)
  }

  watch(
    () => toValue(options.isOpen),
    (open) => {
      if (open) {
        startListening()
      } else {
        stopListening()
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(stopListening)
}

function shouldSkipConfirm(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return true
  }

  const target = event.target
  if (!(target instanceof HTMLElement)) { return false }

  if (target.isContentEditable) { return true }

  const tagName = target.tagName
  if (tagName === 'TEXTAREA') { return true }
  if (tagName === 'SELECT') { return true }

  // Let focused buttons/links activate natively (Cancel, Delete, Retry, …)
  // — but only when they are inside an open modal overlay.
  if (isActivateableControl(target) && isInsideModalOverlay(target)) {
    return true
  }

  return false
}

function isActivateableControl(element: HTMLElement): boolean {
  const tagName = element.tagName
  if (tagName === 'BUTTON' || tagName === 'A' || tagName === 'SUMMARY') { return true }
  if (element.getAttribute('role') === 'button') { return true }
  if (tagName === 'INPUT') {
    const inputType = (element as HTMLInputElement).type
    return ['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image'].includes(inputType)
  }
  return false
}

function isInsideModalOverlay(element: HTMLElement): boolean {
  return !!element.closest('[data-modal-overlay]')
}
