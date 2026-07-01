// eslint-disable-next-line import/no-named-as-default
import VuexPersistence from 'vuex-persist'
import { differenceInDays, parse } from 'date-fns'

function migratePillsToPresets () {
  try {
    const raw = window.localStorage.getItem('vuex')
    if (!raw) { return }
    const data = JSON.parse(raw)
    if (data.pills && !data.presets) {
      data.presets = data.pills
      delete data.pills
      window.localStorage.setItem('vuex', JSON.stringify(data))
    }
  } catch (_) {}
}

export default ({ store }) => {
  migratePillsToPresets()

  new VuexPersistence({
    storage: window.localStorage,
    reducer ({ projects, entries, user, apiData, preferences, presets }) {
      const today = new Date()
      return {
        projects: {
          updatedAt: projects.updatedAt,
          projects: projects.projects
            .filter(p => !p.deleted || differenceInDays(today, new Date(p.deletedAt)) < 40)
        },
        entries: {
          entries: entries.entries
            .filter(e => differenceInDays(today, parse(e.day, 'yyyy-MM-dd', new Date())) < 30)
        },
        user: {
          authToken: user.authToken,
          isTokenExpired: user.isTokenExpired,
          info: user.info,
          hasAuthorizedGCal: user.hasAuthorizedGCal,
          jira: user.jira,
          gitlab: user.gitlab
        },
        apiData: {
          projects: apiData.projects,
          lastUpdatedAt: apiData.lastUpdatedAt
        },
        preferences,
        presets: {
          updatedAt: presets.updatedAt,
          presets: presets.presets
            .filter(preset => !preset.deleted || differenceInDays(today, new Date(preset.deletedAt)) < 40)
        }
      }
    }
  }).plugin(store)
}
