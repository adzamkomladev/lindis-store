<script setup lang="ts">
const { data } = await useFetch('/api/settings/banner')

const promoMessages = computed(() => {
  const text = data.value?.bannerText
  if (!text) return []
  return [text, text, text, text]
})
</script>

<template>
  <div v-if="promoMessages.length > 0" class="relative z-30 monolith-gradient text-white py-2 overflow-hidden">
    <div class="marquee-container">
      <div class="marquee-content">
        <span v-for="(message, idx) in promoMessages" :key="idx" class="marquee-item font-label">
          {{ message }}
        </span>
      </div>
      <div class="marquee-content" aria-hidden="true">
        <span v-for="(message, idx) in promoMessages" :key="`duplicate-${idx}`" class="marquee-item font-label">
          {{ message }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee-container {
  display: flex;
  width: 100%;
}

.marquee-content {
  display: flex;
  animation: scroll 45s linear infinite;
  white-space: nowrap;
}

.marquee-item {
  padding: 0 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.025em;
}

.marquee-item::after {
  content: '★';
  margin-left: 1rem;
  opacity: 0.6;
}

@media (min-width: 768px) {
  .marquee-item {
    padding: 0 2rem;
    font-size: 0.875rem;
  }
  .marquee-item::after {
    margin-left: 2rem;
  }
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
