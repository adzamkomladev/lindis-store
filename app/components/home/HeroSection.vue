<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

defineProps<{
  // These props from index.vue can remain but some will be overridden/ignored to match the mockup
  title: string
  subtitle: string
}>()
</script>

<template>
  <section class="w-full relative bg-background pb-16">
    <!-- Image Header -->
    <div class="relative h-[65vh] min-h-[500px] w-full mt-4 container max-w-screen-2xl mx-auto rounded-lg overflow-hidden border-0">
      <NuxtImg
        src="/storefront_hero_kitchen.png"
        alt="Premium Lindi's Store kitchen"
        class="w-full h-full object-cover"
      />
      <!-- Slight gradient overlay for base image depth -->
      <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
      
      <!-- Overlay Card -->
      <div class="absolute bottom-8 left-8 sm:bottom-16 sm:left-16 bg-surface-container-lowest/95 backdrop-blur-md p-8 sm:p-12 max-w-xl rounded-lg shadow-xl shadow-black/5">
        <span class="text-secondary font-label font-bold uppercase tracking-widest text-[10px] mb-4 block">
          OCT. 2024 - THE CULINARY EDITORIAL
        </span>
        <h1 class="text-on-surface font-headline font-medium text-4xl sm:text-5xl leading-tight mb-6">
          Where Heritage Meets the Modern Kitchen
        </h1>
        <p class="text-on-surface-variant font-body text-base leading-relaxed mb-8">
          Curating timeless pieces that transform everyday cooking into an interactive, elevated experience.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <NuxtLink
            to="/products"
            class="bg-primary text-white hover:bg-primary-container px-8 py-4 rounded-md font-label font-bold uppercase text-xs tracking-widest text-center transition-all shadow-sm"
          >
            Shop the Collection
          </NuxtLink>
          <NuxtLink
            to="#"
            class="bg-surface-container-low text-on-surface hover:bg-surface-container px-8 py-4 rounded-md font-label font-bold uppercase text-xs tracking-widest text-center transition-all"
          >
            Read Journal
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
