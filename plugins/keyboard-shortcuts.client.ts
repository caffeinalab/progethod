export default defineNuxtPlugin(() => {
  const eventBus = useEventBus()
  const router = useRouter()

  const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
  const INTEGRATION_KEYS: Record<string, keyof typeof eventBus.emit extends (type: infer T, ...args: any[]) => any ? T : never> = {
    c: 'shortcut:import-gcal',
    j: 'shortcut:import-jira',
    g: 'shortcut:import-gitlab',
  }

  let leaderActive = false

  function dismissLeader() {
    if (!leaderActive) { return }
    leaderActive = false
    eventBus.emit('shortcut:integration-hint', false)
  }

  function activateLeader() {
    leaderActive = true
    eventBus.emit('shortcut:integration-hint', true)
  }

  function isTyping(event: KeyboardEvent): boolean {
    const tag = (event.target as HTMLElement).tagName
    if (IGNORED_TAGS.has(tag)) { return true }
    if ((event.target as HTMLElement).isContentEditable) { return true }
    return false
  }

  function onKeydown(event: KeyboardEvent) {
    const typing = isTyping(event)

    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      eventBus.emit('shortcut:submit-day')
      return
    }

    if (event.ctrlKey && event.key === 'Backspace') {
      event.preventDefault()
      eventBus.emit('shortcut:nuke-day')
      return
    }

    if (!event.repeat && event.ctrlKey && event.key.toLowerCase() === 'i') {
      event.preventDefault()
      if (typing) { (document.activeElement as HTMLElement)?.blur() }
      activateLeader()
      return
    }

    if (leaderActive) {
      const key = event.key.toLowerCase()
      if (key === 'control' || key === 'meta') { return }
      event.preventDefault()
      const integrationEvent = INTEGRATION_KEYS[key]
      dismissLeader()
      if (integrationEvent) {
        eventBus.emit(integrationEvent)
      }
      return
    }

    if (typing) { return }
    if (event.metaKey || event.ctrlKey || event.altKey) { return }

    const key = event.key.toLowerCase()

    switch (key) {
      case 'arrowleft':
        event.preventDefault()
        eventBus.emit('shortcut:prev-week')
        break
      case 'arrowright':
        event.preventDefault()
        eventBus.emit('shortcut:next-week')
        break
      case 'arrowup':
        event.preventDefault()
        eventBus.emit('shortcut:focus-prev')
        break
      case 'arrowdown':
        event.preventDefault()
        eventBus.emit('shortcut:focus-next')
        break
      case 'enter':
        event.preventDefault()
        eventBus.emit('shortcut:enter-day')
        break
      case 'escape':
        event.preventDefault()
        eventBus.emit('shortcut:exit-day')
        break
      case 'w':
        event.preventDefault()
        eventBus.emit('shortcut:current-week')
        break
      case 'n':
        event.preventDefault()
        eventBus.emit('shortcut:add-entry')
        break
      case 't':
        event.preventDefault()
        router.push('/')
        break
      case 'p':
        event.preventDefault()
        router.push('/projects')
        break
      case 's':
        event.preventDefault()
        router.push('/presets')
        break
      case 'c':
        event.preventDefault()
        router.push('/ferie')
        break
      case '?':
        event.preventDefault()
        eventBus.emit('shortcut:show-help')
        break
    }
  }

  function onKeyup(event: KeyboardEvent) {
    if (!leaderActive) { return }
    if (event.key !== 'Control') { return }
    dismissLeader()
  }

  function onBlur() {
    if (!leaderActive) { return }
    dismissLeader()
  }

  document.addEventListener('keydown', onKeydown)
  document.addEventListener('keyup', onKeyup)
  window.addEventListener('blur', onBlur)
})
