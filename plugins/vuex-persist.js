// eslint-disable-next-line import/no-named-as-default
import VuexPersistence from 'vuex-persist'
import { differenceInDays, parse } from 'date-fns'

export default ({ store }) => {
  new VuexPersistence({
    storage: window.localStorage,
    reducer ({ projects, entries, user, apiData, preferences, pills }) {
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
        pills: {
          updatedAt: pills.updatedAt,
          pills: pills.pills
            .filter(pill => !pill.deleted || differenceInDays(today, new Date(pill.deletedAt)) < 40)
        }
      }
    }
  }).plugin(store)
}
