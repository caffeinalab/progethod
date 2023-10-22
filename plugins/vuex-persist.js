// eslint-disable-next-line import/no-named-as-default
import VuexPersistence from 'vuex-persist'
import { differenceInDays, parse } from 'date-fns'

export default ({ store }) => {
  new VuexPersistence({
    storage: window.localStorage,
    reducer ({ projects, entries, user, apiData, preferences }) {
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
          hasAuthorizedGCal: user.hasAuthorizedGCal
        },
        apiData: {
          projects: apiData.projects,
          lastUpdatedAt: apiData.lastUpdatedAt
        },
        preferences
      }
    }
  }).plugin(store)
}
