<script setup lang="ts">
import PromoBanner from '~/components/PromoBanner.vue'
import AppHeader from '~/components/AppHeader.vue'
import AppFooter from '~/components/AppFooter.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <div class="sticky top-0 z-50">
      <PromoBanner />
      <AppHeader />
    </div>
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
