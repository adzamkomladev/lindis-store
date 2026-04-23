<script setup lang="ts">
useHead({
  titleTemplate: (title) => title ? `${title} | Lindi's Store` : "Lindi's Store - Premium Hydration"
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <AppAlertDialog />
  </ClientOnly>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(0.5rem);
}
</style>