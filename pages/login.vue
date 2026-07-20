<template>
  <div class="m-10 pt-20 text-ink">
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

if (route.query.token) {
  const token = route.query.token as string
  const { data } = await api.$get<{ data: any }>('me', {
    headers: { 'x-sf-sess-id': token },
  })
  userStore.setToken(token)
  userStore.updateInfo(data)
  await router.replace('/')
}

definePageMeta({
  layout: 'default',
})
</script>
