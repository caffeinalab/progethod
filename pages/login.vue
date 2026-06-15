<template>
  <div class="m-10 pt-20">
    <ol class="list-decimal list-inside space-y-2">
      <li>
        {{ $t("login_tutorial.step_1") }}<a class="underline text-blue-600" target="_blank" :href="loginExtensionUrl">{{ $t("login_tutorial.step_1_cta_store") }}</a>{{ $t("login_tutorial.step_1_alt") }}<a class="underline text-blue-600" href="/progethod-extension.zip" download>{{ $t("login_tutorial.step_1_cta_download") }}</a>
      </li>
      <li>
        {{ $t("login_tutorial.step_2") }}
        <ol class="list-[lower-alpha] list-inside ml-4 mt-1 space-y-1">
          <li>{{ $t("login_tutorial.step_2a") }}</li>
          <li v-html="$t('login_tutorial.step_2b')" />
          <li v-html="$t('login_tutorial.step_2c')" />
        </ol>
      </li>
      <li>
        {{ $t("login_tutorial.step_3") }}
      </li>
      <li>
        {{ $t("login_tutorial.step_4") }}
      </li>
    </ol>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'

export default {
  async asyncData ({ $axios, store, query, redirect, env }) {
    if (query.token) {
      const { data } = await $axios.$get('me', {
        headers: {
          'x-sf-sess-id': query.token
        }
      })

      store.commit('user/setToken', query.token)
      store.commit('user/updateInfo', data)

      return redirect('/')
    }

    return {
      instructionVideoUrl: env.instructionVideoUrl,
      loginExtensionUrl: env.loginExtensionUrl,
      authCookie: null
    }
  },
  methods: {
    ...mapMutations({
      setToken: 'user/setToken',
      updateInfo: 'user/updateInfo'
    })
  }
}
</script>

<style>

</style>
