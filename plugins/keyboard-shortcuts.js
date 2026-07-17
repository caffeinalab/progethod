const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

const INTEGRATION_KEYS = {
  c: 'shortcut:import-gcal',
  j: 'shortcut:import-jira',
  g: 'shortcut:import-gitlab'
}

let leaderActive = false

function dismissLeader (nuxt) {
  if (!leaderActive) { return }
  leaderActive = false
  nuxt.$emit('shortcut:integration-hint', false)
}

function activateLeader (nuxt) {
  leaderActive = true
  nuxt.$emit('shortcut:integration-hint', true)
}

function isTyping (event) {
  const tag = event.target.tagName
  if (IGNORED_TAGS.has(tag)) { return true }
  if (event.target.isContentEditable) { return true }
  return false
}

export default () => {
  if (typeof document === 'undefined') { return }

  document.addEventListener('keydown', (event) => {
    const nuxt = window.$nuxt
    if (!nuxt) { return }

    const typing = isTyping(event)

    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      nuxt.$emit('shortcut:submit-day')
      return
    }

    if (event.ctrlKey && event.key === 'Backspace') {
      event.preventDefault()
      nuxt.$emit('shortcut:nuke-day')
      return
    }

    if (!event.repeat && event.ctrlKey && event.key.toLowerCase() === 'i') {
      event.preventDefault()
      if (typing) { document.activeElement.blur() }
      activateLeader(nuxt)
      return
    }

    if (leaderActive) {
      const key = event.key.toLowerCase()
      if (key === 'control' || key === 'meta') { return }
      event.preventDefault()
      const integrationEvent = INTEGRATION_KEYS[key]
      dismissLeader(nuxt)
      if (integrationEvent) {
        nuxt.$emit(integrationEvent)
      }
      return
    }

    if (typing) { return }

    if (event.metaKey || event.ctrlKey || event.altKey) { return }

    const key = event.key.toLowerCase()

    switch (key) {
      case 'arrowleft':
        event.preventDefault()
        nuxt.$emit('shortcut:prev-week')
        break
      case 'arrowright':
        event.preventDefault()
        nuxt.$emit('shortcut:next-week')
        break
      case 'arrowup':
        event.preventDefault()
        nuxt.$emit('shortcut:focus-prev')
        break
      case 'arrowdown':
        event.preventDefault()
        nuxt.$emit('shortcut:focus-next')
        break
      case 'enter':
        event.preventDefault()
        nuxt.$emit('shortcut:enter-day')
        break
      case 'escape':
        event.preventDefault()
        nuxt.$emit('shortcut:exit-day')
        break
      case 'w':
        event.preventDefault()
        nuxt.$emit('shortcut:current-week')
        break
      case 'n':
        event.preventDefault()
        nuxt.$emit('shortcut:add-entry')
        break
      case 't':
        event.preventDefault()
        nuxt.$router.push('/')
        break
      case 'p':
        event.preventDefault()
        nuxt.$router.push('/projects')
        break
      case 's':
        event.preventDefault()
        nuxt.$router.push('/presets')
        break
      case 'c':
        event.preventDefault()
        nuxt.$router.push('/ferie')
        break
      case '?':
        event.preventDefault()
        nuxt.$emit('shortcut:show-help')
        break
    }
  })

  document.addEventListener('keyup', (event) => {
    if (!leaderActive) { return }
    if (event.key !== 'Control') { return }
    const nuxt = window.$nuxt
    if (!nuxt) { return }
    dismissLeader(nuxt)
  })

  window.addEventListener('blur', () => {
    if (!leaderActive) { return }
    const nuxt = window.$nuxt
    if (!nuxt) { return }
    dismissLeader(nuxt)
  })
}
