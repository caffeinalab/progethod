<template>
  <div class="bg-page w-full h-full min-h-screen flex items-center justify-center px-6">
    <div class="text-center max-w-md">
      <p class="text-8xl font-bold text-accent mb-4">
        {{ error.statusCode }}
      </p>
      <h1 class="text-2xl font-semibold text-ink mb-2">
        {{ title }}
      </h1>
      <p class="text-sm text-ink-muted mb-8">
        {{ description }}
      </p>
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-ink-inverse font-medium text-sm hover:bg-accent-hover transition-colors"
      >
        &larr; Torna al timesheet
      </NuxtLink>
    </div>
  </div>
</template>

<script>
export default {
  layout: false,
  props: {
    error: {
      type: Object,
      default: () => ({ statusCode: 500, message: '' })
    }
  },
  computed: {
    title () {
      if (this.error.statusCode === 404) {
        return 'Pagina non trovata'
      }
      return 'Qualcosa è andato storto'
    },
    description () {
      if (this.error.statusCode === 404) {
        return 'La pagina che stai cercando non esiste o è stata spostata.'
      }
      return this.error.message || 'Si è verificato un errore imprevisto.'
    }
  }
}
</script>
