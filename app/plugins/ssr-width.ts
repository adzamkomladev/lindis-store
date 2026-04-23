import { provideSSRWidth } from '@vueuse/core'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return
  provideSSRWidth(1024, nuxtApp.vueApp)
})
