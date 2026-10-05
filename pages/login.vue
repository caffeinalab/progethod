<template>
  <div class="m-10 pt-20 text-ink">
    <p v-if="loginError" class="mb-6 text-danger">
      {{ $t("login_tutorial.error_invalid_token") }}
    </p>
    <ol class="list-decimal list-inside space-y-2">
      <li>
        {{ $t("login_tutorial.step_1") }}<a class="underline text-accent-fg" target="_blank" :href="config.public.loginExtensionUrl">{{ $t("login_tutorial.step_1_cta_store") }}</a>{{ $t("login_tutorial.step_1_alt") }}<a class="underline text-accent-fg" href="/progethod-extension.zip" download>{{ $t("login_tutorial.step_1_cta_download") }}</a>
      </li>
      <li>
        {{ $t("login_tutorial.step_2") }}
        <ol class="list-[lower-alpha] list-inside ml-4 mt-1 space-y-1">
          <li>{{ $t("login_tutorial.step_2a") }}</li>
          <li v-html="$t('login_tutorial.step_2b')" />
          <li v-html="$t('login_tutorial.step_2c')" />
        </ol>
      </li>
      <li>{{ $t("login_tutorial.step_3") }}</li>
      <li>{{ $t("login_tutorial.step_4") }}</li>
      <li>{{ $t("login_tutorial.step_5") }}</li>
    </ol>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const userStore = useUserStore()
const api = useApi()

const loginError = ref(false)

// The extension hands the token over via a short-lived first-party cookie
// (set before the tab opens); the query param is the legacy flow for older
// extension versions
function consumeTokenCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)progethod_login_token=([^;]*)/)
  if (!match) return null
  document.cookie = 'progethod_login_token=; max-age=0; path=/; secure; samesite=strict'
  return decodeURIComponent(match[1]!)
}

const queryToken = route.query.token as string | undefined
const token = queryToken || consumeTokenCookie()

if (token) {
  if (queryToken) {
    // Strip the token from the address bar before any await, so it never
    // lingers in the URL (tab hover preview, history) while /me is in flight
    window.history.replaceState(null, '', '/login')
  }
  try {
    const { data } = await api.$get<{ data: any }>('me', {
      headers: { 'x-sf-sess-id': token },
    })
    userStore.setToken(token)
    userStore.updateInfo(data)
    await router.replace('/')
  } catch {
    loginError.value = true
  }
}

definePageMeta({
  layout: 'default',
})
</script>
