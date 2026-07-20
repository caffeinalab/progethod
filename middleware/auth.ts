export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore()
  if (!userStore.authToken) {
    return navigateTo('/login')
  }
})
