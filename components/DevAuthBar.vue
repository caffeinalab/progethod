<template>
  <div v-if="isDevMode" class="fixed bottom-0 left-0 right-0 z-[9999]">
    <div
      class="mx-auto transition-all duration-200"
      :class="expanded ? 'max-w-lg' : 'max-w-[10rem]'"
    >
      <button
        v-if="!expanded"
        class="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-t-lg bg-warning-soft text-warning-text border border-b-0 border-warning-text/20 hover:bg-warning-text/20 transition-colors"
        @click="expanded = true"
      >
        <code-icon width="14" height="14" />
        {{ $t('dev_bar.label') }}
        <span v-if="hasToken" class="inline-block w-1.5 h-1.5 rounded-full" :class="isTokenExpired ? 'bg-danger' : 'bg-success'" />
      </button>

      <div
        v-else
        class="rounded-t-lg bg-card border border-b-0 border-warning-text/30 shadow-lg"
      >
        <div
          class="flex items-center justify-between px-3 py-1.5 bg-warning-soft rounded-t-lg border-b border-warning-text/20 cursor-pointer"
          @click="expanded = false"
        >
          <span class="text-xs font-semibold text-warning-text flex items-center gap-1.5">
            <code-icon width="14" height="14" />
            {{ $t('dev_bar.label') }}
          </span>
          <chevron-down-icon width="14" height="14" class="text-warning-text" />
        </div>

        <div class="p-3 space-y-2">
          <div v-if="hasToken" class="flex items-center gap-2 text-xs">
            <span class="inline-block w-2 h-2 rounded-full flex-shrink-0" :class="isTokenExpired ? 'bg-danger' : 'bg-success'" />
            <span class="text-ink-secondary break-all font-mono select-all cursor-text">
              {{ maskedToken }}
            </span>
          </div>
          <div v-else class="text-xs text-ink-muted">
            {{ $t('dev_bar.no_token') }}
          </div>

          <div class="flex gap-2">
            <input
              ref="tokenInput"
              v-model="tokenValue"
              type="text"
              :placeholder="$t('dev_bar.placeholder')"
              class="flex-1 min-w-0 px-2 py-1.5 text-xs font-mono rounded border border-stroke bg-page text-ink placeholder-ink-muted focus:outline-none focus:border-accent"
              @keydown.enter="applyToken"
            >
            <button
              class="px-3 py-1.5 text-xs font-semibold rounded transition-colors"
              :class="tokenValue.trim()
                ? 'bg-accent text-ink-inverse hover:bg-accent-hover'
                : 'bg-card-hover text-ink-disabled cursor-not-allowed'"
              :disabled="!tokenValue.trim() || loading"
              @click="applyToken"
            >
              <loader-icon v-if="loading" width="14" height="14" class="animate-spin" />
              <template v-else>
                {{ $t('dev_bar.apply') }}
              </template>
            </button>
          </div>

          <p v-if="error" class="text-xs text-danger">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import { ChevronDownIcon, CodeIcon, LoaderIcon } from 'vue-tabler-icons'

export default {
  components: { ChevronDownIcon, CodeIcon, LoaderIcon },
  data () {
    return {
      expanded: false,
      tokenValue: '',
      loading: false,
      error: null
    }
  },
  computed: {
    ...mapGetters({
      authToken: 'user/authToken',
      isTokenExpired: 'user/isTokenExpired'
    }),
    isDevMode () {
      return process.env.NODE_ENV === 'development'
    },
    hasToken () {
      return !!this.authToken
    },
    maskedToken () {
      return this.authToken || ''
    }
  },
  methods: {
    ...mapMutations({
      setToken: 'user/setToken',
      updateInfo: 'user/updateInfo'
    }),
    async applyToken () {
      const token = this.tokenValue.trim()
      if (!token) { return }

      this.loading = true
      this.error = null

      try {
        const { data } = await this.$axios.$get('me', {
          headers: { 'x-sf-sess-id': token }
        })

        this.setToken(token)
        this.updateInfo(data)
        this.tokenValue = ''
        this.expanded = false

        window.location.reload()
      } catch (err) {
        const status = err.response?.status
        this.error = status === 401
          ? this.$t('dev_bar.error_invalid')
          : this.$t('dev_bar.error_generic', { status: status || 'network' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
