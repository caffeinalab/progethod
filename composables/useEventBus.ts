import mitt from 'mitt'

type Events = {
  'shortcut:submit-day': void
  'shortcut:nuke-day': void
  'shortcut:prev-week': void
  'shortcut:next-week': void
  'shortcut:current-week': void
  'shortcut:focus-prev': void
  'shortcut:focus-next': void
  'shortcut:enter-day': void
  'shortcut:exit-day': void
  'shortcut:add-entry': void
  'shortcut:import-gcal': void
  'shortcut:import-jira': void
  'shortcut:import-gitlab': void
  'shortcut:show-help': void
  'shortcut:integration-hint': boolean
  'tracked-hours:refresh': void
}

const emitter = mitt<Events>()

export function useEventBus() {
  return emitter
}
